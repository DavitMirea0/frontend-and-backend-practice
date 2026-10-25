// M: n × m, r: n × 1. Вычисляем e = Mᵀr без создания копии Mᵀ.
export function analyze(M, r) {
  if (!Array.isArray(M) || !M.length || !Array.isArray(M[0]) || !M[0].length || !Array.isArray(r) || r.length !== M.length) throw new Error('Несовместимые размеры');
  const m = M[0].length;
  if (M.some(row => !Array.isArray(row) || row.length !== m || row.some(v => v !== 0 && v !== 1) || row.reduce((a,b)=>a+b,0)!==1) || r.some(v => v !== 0 && v !== 1)) throw new Error('Ожидаются бинарные данные и одна тема у каждого вопроса');
  const errors = Array(m).fill(0);
  const counts = Array(m).fill(0);
  for (let i = 0; i < M.length; i++) {
    for (let j = 0; j < m; j++) {
      errors[j] += M[i][j] * r[i];
      counts[j] += M[i][j];
    }
  }
  const rates = errors.map((e,j) => counts[j] ? e/counts[j] : null);
  const max = Math.max(...rates.filter(v => v !== null));
  const recommended = max > 0 ? rates.flatMap((v,j) => v === max ? [j] : []) : [];
  return { errors, counts, rates, recommended };
}
