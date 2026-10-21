"""Restore original screen pixels in the five left-device photographic scenes.

The generated environment is retained, not its approximation of the interface.
Screen-only feature registration preserves device orientation (never mirrored).
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
LEFT = PROD / 'left'
LEFT.mkdir(exist_ok=True)
sift = cv2.SIFT_create(nfeatures=22000, contrastThreshold=.012)
matcher = cv2.BFMatcher()
calibrations = {c['id']: c for c in json.loads((PROD/'calibration.json').read_text())}
report = []
for entry in json.loads((PROD/'left-generation.json').read_text()):
    name = entry['id']
    plate = LEFT/f'{name}-outpaint.png'
    if not plate.exists():
        shutil.copyfile(entry['source'], plate)
    photo = np.array(Image.open(plate).convert('RGB'))
    original = np.array(Image.open(PROD/f'{name}-master.png').convert('RGB'))
    result, debug, records = photo.copy(), photo.copy(), []
    k2, d2 = sift.detectAndCompute(cv2.cvtColor(photo, cv2.COLOR_RGB2GRAY), None)
    for i, screen in enumerate(calibrations[name]['screens']):
        mask = np.array(Image.open(PROD/f'{name}-screen-{i+1}-mask.png').convert('L'))
        k1, d1 = sift.detectAndCompute(cv2.cvtColor(original, cv2.COLOR_RGB2GRAY), mask)
        matches = [a for a,b in matcher.knnMatch(d1, d2, k=2) if a.distance < .72*b.distance]
        assert len(matches) >= 12, (name, i, 'insufficient registration')
        p1 = np.float32([k1[m.queryIdx].pt for m in matches])
        p2 = np.float32([k2[m.trainIdx].pt for m in matches])
        H, inliers = cv2.findHomography(p1, p2, cv2.RANSAC, 2.5)
        assert int(inliers.sum()) >= 12, (name, i, 'weak registration')
        quad = cv2.perspectiveTransform(np.float32([screen['displayQuad']]), H)[0]
        # Repeated Swagger rows can register against the wrong column. These
        # measured aperture corners follow the real left-hand laptop bezel.
        if name == 'chatra-api':
            quad = np.float32([[96,192],[717,175],[755,534],[135,598]])
            H = cv2.getPerspectiveTransform(np.float32(screen['displayQuad']), quad)
        assert cv2.contourArea(quad, oriented=True) > 0, (name, 'mirrored plane')
        size = (photo.shape[1], photo.shape[0])
        cw,ch = screen['canvasSize']
        source = Image.open(ROOT/screen['source']).convert('RGB')
        canvas = Image.new('RGB', (cw,ch), (12,13,14))
        x,y,w,h = screen['contentRect']
        canvas.paste(source.resize((w,h), Image.Resampling.LANCZOS), (x,y))
        transform = cv2.getPerspectiveTransform(np.float32([[0,0],[cw-1,0],[cw-1,ch-1],[0,ch-1]]), quad)
        warped = cv2.warpPerspective(np.array(canvas), transform, size, flags=cv2.INTER_LANCZOS4)
        alpha = cv2.warpPerspective(mask, H, size, flags=cv2.INTER_LINEAR).astype(float)[:,:,None]/255
        result = np.clip(warped*alpha+result*(1-alpha), 0,255).astype('uint8')
        cv2.polylines(debug, [quad.astype('int32')], True, (255,70,20), 2)
        records.append({'source':screen['source'], 'matches':len(matches), 'inliers':int(inliers.sum()), 'displayQuad':quad.tolist(), 'registration':H.tolist()})
    image = Image.fromarray(result)
    image.save(LEFT/f'{name}-master.png')
    Image.fromarray(debug).save(LEFT/f'{name}-registration.jpg', quality=94)
    image.save(OUT/f'{name}-editorial-left.webp', quality=95, method=6)
    small = image.copy(); small.thumbnail((1280,1280))
    small.save(OUT/f'{name}-editorial-left-1280.webp', quality=92, method=6)
    report.append({'id':name, 'width':image.width, 'height':image.height, 'screens':records})
    print(name, image.size, [(s['matches'],s['inliers']) for s in records], flush=True)
(LEFT/'calibration.json').write_text(json.dumps(report,indent=2)+'\n')
