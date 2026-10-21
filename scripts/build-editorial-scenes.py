"""Restore authentic display pixels after photographic environment outpainting.

Only display planes are registered, never generated UI. SIFT/RANSAC maps the
previously calibrated original display into the wider photograph. All source
images are retained; final runtime media is a single flattened raster.
"""
from pathlib import Path
import json
import shutil
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/projects/unified'
PROD = OUT / 'production'
WIDE = PROD / 'editorial'
WIDE.mkdir(exist_ok=True)
sift = cv2.SIFT_create(nfeatures=18000, contrastThreshold=.015)
matcher = cv2.BFMatcher()
calibrations = {item['id']: item for item in json.loads((PROD/'calibration.json').read_text())}
report = []
for entry in json.loads((PROD/'wide-generation.json').read_text()):
    name = entry['id']
    plate_path = WIDE/f'{name}-outpaint.png'
    if not plate_path.exists():
        shutil.copyfile(entry['source'], plate_path)
    photo = np.array(Image.open(plate_path).convert('RGB'))
    original = np.array(Image.open(PROD/f'{name}-master.png').convert('RGB'))
    result = photo.copy()
    k2, d2 = sift.detectAndCompute(cv2.cvtColor(photo, cv2.COLOR_RGB2GRAY), None)
    records = []
    debug = photo.copy()
    for i, screen in enumerate(calibrations[name]['screens']):
        mask = np.array(Image.open(PROD/f'{name}-screen-{i+1}-mask.png').convert('L'))
        k1, d1 = sift.detectAndCompute(cv2.cvtColor(original, cv2.COLOR_RGB2GRAY), mask)
        pairs = matcher.knnMatch(d1, d2, k=2)
        good = [a for a,b in pairs if a.distance < .72*b.distance]
        assert len(good) >= 12, (name, i, len(good))
        p1 = np.float32([k1[m.queryIdx].pt for m in good])
        p2 = np.float32([k2[m.trainIdx].pt for m in good])
        H, inliers = cv2.findHomography(p1, p2, cv2.RANSAC, 2.5)
        assert int(inliers.sum()) >= 12, (name, i, 'weak registration')
        quad = cv2.perspectiveTransform(np.float32([screen['displayQuad']]), H)[0]
        # Registration follows UI features; an outpaint can slightly change the
        # physical aperture. This measured correction follows the actual bezel.
        if name == 'chatra-api':
            quad = np.float32([[756,216],[1293,202],[1337,530],[795,592]])
            H = cv2.getPerspectiveTransform(np.float32(screen['displayQuad']), quad)
        size = (photo.shape[1], photo.shape[0])
        # Re-sample from the authentic screenshot, not an already warped raster.
        cw, ch = screen['canvasSize']
        source = Image.open(ROOT/screen['source']).convert('RGB')
        canvas = Image.new('RGB',(cw,ch),(12,13,14))
        x,y,w,h = screen['contentRect']
        canvas.paste(source.resize((w,h),Image.Resampling.LANCZOS),(x,y))
        screen_transform = cv2.getPerspectiveTransform(np.float32([[0,0],[cw-1,0],[cw-1,ch-1],[0,ch-1]]),quad)
        warped = cv2.warpPerspective(np.array(canvas), screen_transform, size, flags=cv2.INTER_LANCZOS4)
        alpha = cv2.warpPerspective(mask, H, size, flags=cv2.INTER_LINEAR).astype(float)[:,:,None]/255
        result = np.clip(warped*alpha+result*(1-alpha),0,255).astype('uint8')
        cv2.polylines(debug,[quad.astype('int32')],True,(255,70,20),2)
        records.append({'source':screen['source'],'matches':len(good),'inliers':int(inliers.sum()),'displayQuad':quad.tolist(),'registration':H.tolist()})
    image = Image.fromarray(result)
    image.save(WIDE/f'{name}-master.png')
    Image.fromarray(debug).save(WIDE/f'{name}-registration.jpg',quality=94)
    image.save(OUT/f'{name}-editorial.webp',quality=95,method=6)
    thumb = image.copy(); thumb.thumbnail((1280,1280))
    thumb.save(OUT/f'{name}-editorial-1280.webp',quality=92,method=6)
    report.append({'id':name,'width':image.width,'height':image.height,'screens':records})
    print(name, image.size, [(s['matches'],s['inliers']) for s in records], flush=True)
(WIDE/'calibration.json').write_text(json.dumps(report,indent=2)+'\n')
