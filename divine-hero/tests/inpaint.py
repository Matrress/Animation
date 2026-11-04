"""Harmonic (Laplace) inpainting used by the plate builders."""
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import spsolve
def laplace_fill(img, U, wall=None):
    """harmonic fill of img (H,W,C float) inside boolean mask U; boundary = known pixels; pixels in `wall` are neither
    filled nor used (no-flux): a region fills from its own side only"""
    H, W = U.shape; idx = -np.ones((H, W), int); ys, xs = np.nonzero(U); n = len(ys); idx[ys, xs] = np.arange(n)
    rows, cols, vals = [np.arange(n)], [np.arange(n)], [np.zeros(n)]; b = np.zeros((n, img.shape[2]))
    deg = np.zeros(n)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        yy, xx = ys + dy, xs + dx; ok = (yy >= 0) & (yy < H) & (xx >= 0) & (xx < W)
        if wall is not None: ok[ok] &= ~wall[yy[ok], xx[ok]]
        deg[ok] += 1
        yk, xk, k = yy[ok], xx[ok], np.nonzero(ok)[0]
        unk = U[yk, xk]
        rows.append(k[unk]); cols.append(idx[yk[unk], xk[unk]]); vals.append(-np.ones(unk.sum()))
        np.add.at(b, k[~unk], img[yk[~unk], xk[~unk]])
    vals[0] = deg
    A = coo_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(n, n)).tocsc()
    out = img.copy()
    for c in range(img.shape[2]): out[ys, xs, c] = spsolve(A, b[:, c])
    return out
