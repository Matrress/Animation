# key frames of the source: the clip carries only every 3rd frame as a new picture (about 10 pictures a second); the rest are repeats. That is what made the
# movement tick. Here the real transitions are found and the motion between consecutive real pictures is measured (dense optical flow), so the film can be made
# at any speed with a smooth, continuous movement.
import numpy as np, cv2, json
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
def img(i):
    F = np.load(f'cache3/F{i:03d}.npy').astype(np.float32); A = np.load(f'cache3/A{i:03d}.npy').astype(np.float32) / 255
    return F * A[..., None], A
prev = None; spikes = []
for i in range(8, 117):
    P, A = img(i)
    if prev is not None and np.abs(P - prev).mean() > 1.0: spikes.append(i - 1)       # frame i-1 -> i is a real change
    prev = P
print(len(spikes), spikes[:12], '...')
lens = []
for j in spikes:
    P0, A0 = img(j); P1, A1 = img(j + 1)
    g = lambda P, A: cv2.cvtColor((P + 128 * (1 - A[..., None])).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    g0, g1 = g(P0, A0), g(P1, A1)
    fw = dis.calc(g0, g1, None); bw = dis.calc(g1, g0, None)
    np.save(f'cache3/kfw{j:03d}.npy', fw.astype(np.float16)); np.save(f'cache3/kbw{j:03d}.npy', bw.astype(np.float16))
    m = A0 > 0.5; lens.append(float(np.linalg.norm(fw[m], axis=-1).mean()))
json.dump({'spikes': spikes, 'len': lens}, open('cache3/keys.json', 'w'))
print(np.round(lens, 1).tolist())
