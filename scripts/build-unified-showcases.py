"""Offline deterministic screen replacement; no generated UI, no runtime layers.

Run with Pillow, numpy and OpenCV. Originals are read-only. Production plates,
screen masks, calibration data and lossless masters remain separately editable.
"""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/projects/unified'
PROD = OUT / 'production'
SPECS = [
 ('chatra', [('assets/projects/chatra/classroom-1060.webp',(560,500),1.6),('assets/projects/chatra/mobile-classes-360.webp',(1110,680),6/13)]),
 ('soyle', [('assets/projects/soyle/adaptive-plan-1440.webp',(650,450),1.6)]),
 ('digital-urpaq', [('assets/projects/digital-urpaq/discovery-1060.webp',(550,450),1.6)]),
 ('freelanceos', [('assets/projects/devices/freelanceos-display.webp',(600,600),364/811)]),
 ('rugpull-risk', [('assets/projects/rugpull/risk-dashboard-1000.webp',(450,400),1.6)]),
 ('forge', [('assets/projects/forge/landing-1200.webp',(650,450),1.6)]),
 ('portfolio', [('assets/projects/editorial/portfolio-home-1440.webp',(600,450),1.6)]),
 ('chatra-api', [('assets/projects/chatra/api-reference-1060.webp',(450,450),1.6)]),
 ('chatra-mobile', [('assets/projects/chatra/mobile-classes-360.webp',(350,500),6/13),('img/video-posters/subjects.jpg',(900,600),6/13)]),
 ('cs50p-odin', [('assets/projects/learning/cs50p-week9.png',(650,450),1.6)]),
]

def screen_mask(plate, seed):
    # The neutral display is separated from its bezel by a high-contrast edge.
    delta = plate.max(axis=2).astype(int)-plate.min(axis=2)
    gray = plate.mean(axis=2)
    eligible = ((delta<18)&(gray>65)&(gray<190)).astype('uint8')
    _,labels = cv2.connectedComponents(eligible)
    label = labels[seed[1],seed[0]]
    assert label, f'No display at {seed}'
    mask = ((labels==label)*255).astype('uint8')
    assert mask.sum()/255 > 10000
    return mask

def order(points):
    points=np.array(points,dtype='float32')
    s=points.sum(axis=1); d=np.diff(points,axis=1)[:,0]
    return np.array([points[s.argmin()],points[d.argmin()],points[s.argmax()],points[d.argmax()]],dtype='float32')

def quad_for(mask, phone):
    contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    c=max(contours,key=cv2.contourArea)
    if not phone:
        q=cv2.approxPolyDP(c,.012*cv2.arcLength(c,True),True)
        assert len(q)==4, f'Expected planar display: {len(q)}'
        return order(q.reshape(4,2))
    # Rounded phone corners: fit each straight edge, then intersect lines. This
    # recovers the complete display plane, not the inset rounded contour bounds.
    box=order(cv2.boxPoints(cv2.minAreaRect(c)))
    pts=c[:,0,:].astype(float); lines=[]
    for i in range(4):
        a,b=box[i],box[(i+1)%4]; vec=b-a; length=np.linalg.norm(vec)
        t=((pts-a)@vec)/(length*length)
        diff=pts-a
        dist=np.abs(vec[0]*diff[:,1]-vec[1]*diff[:,0])/length
        subset=pts[(t>.18)&(t<.82)&(dist<12)]
        vx,vy,x,y=cv2.fitLine(subset.astype('float32'),cv2.DIST_L2,0,.01,.01).ravel()
        lines.append((np.array([x,y]),np.array([vx,vy])))
    corners=[]
    for i in range(4):
        a,v=lines[(i-1)%4]; b,w=lines[i]
        t=np.linalg.solve(np.column_stack([v,-w]),b-a)[0]
        corners.append(a+t*v)
    return np.array(corners,dtype='float32')

manifest=[]
for name,screens in SPECS:
    plate_path=PROD/f'{name}-plate.png'
    if name=='chatra-mobile': plate_path=PROD/'chatra-mobile-refined-plate.png'
    plate=np.array(Image.open(plate_path).convert('RGB'))
    result=plate.copy(); calibration=[]; debug=plate.copy()
    for i,(source,seed,ratio) in enumerate(screens):
        phone=ratio<1
        mask=screen_mask(plate,seed)
        quad=quad_for(mask,phone)
        src=Image.open(ROOT/source).convert('RGB')
        # Contain (never crop) authentic content on a black display canvas.
        cw=1600 if not phone else 800; ch=round(cw/ratio)
        canvas=Image.new('RGB',(cw,ch),(12,13,14))
        fit=min(cw/src.width,ch/src.height)
        fitted=src.resize((round(src.width*fit),round(src.height*fit)),Image.Resampling.LANCZOS)
        origin=((cw-fitted.width)//2,(ch-fitted.height)//2)
        canvas.paste(fitted,origin)
        # Homography is the only geometric operation on the real screenshot.
        H=cv2.getPerspectiveTransform(np.float32([[0,0],[cw-1,0],[cw-1,ch-1],[0,ch-1]]),quad)
        warped=cv2.warpPerspective(np.array(canvas),H,(plate.shape[1],plate.shape[0]),flags=cv2.INTER_LANCZOS4)
        # 1% scene-derived screen-glass response: no invented UI or color repaint.
        glass=warped.astype(float)*.99+plate.astype(float)*.01
        # A subpixel feather avoids a hard raster seam at the glass/bezel edge.
        alpha=cv2.GaussianBlur(mask,(3,3),.45).astype(float)[:,:,None]/255
        result=np.clip(glass*alpha+result*(1-alpha),0,255).astype('uint8')
        Image.fromarray(mask).save(PROD/f'{name}-screen-{i+1}-mask.png')
        cv2.polylines(debug,[quad.astype('int32')],True,(255,70,30),2)
        # Save a comparison at the actual screen's available sampling resolution.
        inverse=cv2.warpPerspective(result,np.linalg.inv(H),(cw,ch),flags=cv2.INTER_LINEAR)
        pair=Image.new('RGB',(cw*2,ch),(40,40,40));pair.paste(canvas,(0,0));pair.paste(Image.fromarray(inverse),(cw,0))
        pair.thumbnail((1600,1200));pair.save(PROD/f'{name}-screen-{i+1}-comparison.jpg',quality=94)
        calibration.append({'source':source,'originalSize':list(src.size),'displayQuad':quad.tolist(),'canvasSize':[cw,ch],'contentRect':[origin[0],origin[1],fitted.width,fitted.height],'homography':H.tolist(),'glassBlend':.01})
    Image.fromarray(result).save(PROD/f'{name}-master.png')
    Image.fromarray(debug).save(PROD/f'{name}-calibration.jpg',quality=92)
    Image.fromarray(result).save(OUT/f'{name}-showcase.webp',quality=95,method=6)
    Image.fromarray(result).resize((800,800),Image.Resampling.LANCZOS).save(OUT/f'{name}-showcase-800.webp',quality=92,method=6)
    manifest.append({'id':name,'asset':f'assets/projects/unified/{name}-showcase.webp','width':plate.shape[1],'height':plate.shape[0],'screens':calibration})
    print(name, [np.round(s['displayQuad'],1).tolist() for s in calibration])
(PROD/'calibration.json').write_text(json.dumps(manifest,indent=2)+'\n')
