// 전체 리팩토링된 JavaScript 코드 (Run1, Run2 모두 2가지 솔루션 출력)

// 전역 변수 저장용
let run1_calculated_w1 = 0;
let run1_recorded_u0 = 0;
let run1_recorded_a0 = 0;
let run1_recorded_n1 = 0;

const AVAILABLE_WEIGHTS = [17.31, 14.71, 12, 9.16, 6.24, 3.14];
const WEIGHT_LABELS = ['P06', 'P05', 'P04', 'P03', 'P02', 'P01'];
const W1_FACTORS = { 95: 32.2, 99: 28.6 };
const ALLOWED_DEVIATION = 2;

function generateHoleNumberList(centerHole, combinationLength) {
    const totalHoles = 38;
    const half = Math.floor(combinationLength / 2);
    const holeList = [];
    let centerHoleIndex = -1;

    for (let i = 0; i < combinationLength; i++) {
        let currentHole = i < half ? centerHole - (half - i) : i === half ? centerHole : centerHole + (i - half);
        currentHole = ((currentHole - 1 + totalHoles) % totalHoles) + 1;
        if (i === half) centerHoleIndex = i;
        holeList.push(currentHole);
    }
    return { holes: holeList, centerIndex: centerHoleIndex };
}

function getInitialHoleNumber(a0, n1_percent) {
    const ranges = [
        [0, 10], [10, 19], [19, 29], [29, 38], [38, 48], [48, 57], [57, 67], [67, 76],
        [76, 86], [86, 95], [95, 105], [105, 114], [114, 124], [124, 133], [133, 143], [143, 152],
        [152, 162], [162, 171], [171, 181], [181, 190], [190, 199], [199, 209], [209, 218], [218, 228],
        [228, 237], [237, 247], [247, 256], [256, 266], [266, 275], [275, 285], [285, 294], [294, 304],
        [304, 313], [313, 323], [323, 332], [332, 342], [342, 351], [351, 360]
    ];
    const h95 = [25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,38,37,36,35,34,33,32,31,30,29,28,27,26];
    const h99 = [26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,38,37,36,35,34,33,32,31,30,29,28,27];

    for (let i = 0; i < ranges.length; i++) {
        if (a0 >= ranges[i][0] && a0 < ranges[i][1]) return n1_percent === 95 ? h95[i] : h99[i];
    }
    const degreesPerHole = 360 / 38;
    return ((Math.round(a0 / degreesPerHole + 8.56) - 1 + 38) % 38) + 1;
}

function findTopTwoCombinations(targetWeight, n1_percent, u0) {
    let results = [];
    let maxTotalCount = (u0 < 3) ? 7 : (n1_percent === 95 ? 9 : 7);
    const maxPairs = Math.floor((maxTotalCount - 1) / 2);
    const sortedWeights = [...AVAILABLE_WEIGHTS].sort((a, b) => b - a);

    function evaluateCombination(combination) {
        const total = combination.reduce((a, b) => a + b, 0);
        const weightCounts = {};
        combination.forEach(w => weightCounts[w] = (weightCounts[w] || 0) + 1);
        const unique = Object.keys(weightCounts).length;
        const duplicateScore = Object.values(weightCounts).reduce((sum, count) => sum + (count - 1), 0);
        const p01count = weightCounts[3.14] || 0;
        return {
            deviation: Math.abs(targetWeight - total),
            duplicateScore,
            uniqueCount: unique,
            total,
            valid: (p01count <= 2),
            combination
        };
    }

    function generateRecursive(pairCount, sideCombo, lastIndex, centerWeight) {
        const total = centerWeight + 2 * sideCombo.reduce((a, b) => a + b, 0);
        if (total > targetWeight + 2) return;
        const fullCombo = [...sideCombo.slice().reverse(), centerWeight, ...sideCombo];
        if (fullCombo.some(w => w > centerWeight)) return;

        const evalResult = evaluateCombination(fullCombo);
        if (evalResult.valid) {
            results.push(evalResult);
        }

        if (pairCount < maxPairs) {
            for (let i = lastIndex; i < sortedWeights.length; i++) {
                generateRecursive(pairCount + 1, [...sideCombo, sortedWeights[i]], i, centerWeight);
            }
        }
    }

    for (let i = 0; i < sortedWeights.length; i++) {
        generateRecursive(0, [], i, sortedWeights[i]);
    }

    results.sort((a, b) => {
        if (a.deviation !== b.deviation) return a.deviation - b.deviation;
        if (a.duplicateScore !== b.duplicateScore) return a.duplicateScore - b.duplicateScore;
        return b.total - a.total;
    });

    return results.slice(0, 2).map(r => ({ totalWeight: r.total, combination: r.combination }));
}

function displayResult(runName, n1, u, a, w, hole, results) {
    const cards = results.map((result, idx) => {
        const { holes, centerIndex } = generateHoleNumberList(hole, result.combination.length);
        const rows = result.combination.map((w, i) => {
            const labelIndex = AVAILABLE_WEIGHTS.findIndex(v => v === w);
            const label = labelIndex !== -1 ? WEIGHT_LABELS[labelIndex] : '-';
            const holeClass = (i === centerIndex) ? 'bg-info fw-bold' : '';
            return `<tr><td class="${holeClass}">${holes[i]}</td><td class="${holeClass}">${w.toFixed(2)}</td><td class="${holeClass}">${label}</td></tr>`;
        }).join('');

        const summary = WEIGHT_LABELS.map((label, i) => {
            const count = result.combination.filter(w => w === AVAILABLE_WEIGHTS[i]).length;
            return count ? `<li>${label}: ${count} ea</li>` : '';
        }).join('');

        return `
        <div class="card my-2">
            <div class="card-body">
                <h6 class="text-primary">${runName} 솔루션 ${idx + 1}</h6>
                <table class="table table-sm table-striped">
                    <thead><tr><th>Hole</th><th>Weight(g)</th><th>Type</th></tr></thead><tbody>${rows}</tbody>
                </table>
                <ul><li><strong>Total:</strong> ${result.totalWeight.toFixed(2)} g</li>${summary}</ul>
                <p><strong>Deviation:</strong> ${(result.totalWeight - w).toFixed(2)} g</p>
            </div>
        </div>`;
    }).join('');

    document.getElementById('modalResultContent').innerHTML = `<h5>${runName} 결과 (${n1}%)</h5>${cards}`;
    new bootstrap.Modal(document.getElementById('resultModal')).show();
}

function calculateRun1() {
    const n1 = parseFloat(document.getElementById('run1_n1').value);
    const a0 = parseFloat(document.getElementById('run1_a0').value);
    const u0 = parseFloat(document.getElementById('run1_u0').value);
    if (isNaN(n1) || isNaN(a0) || isNaN(u0)) return alert("Run1 입력 오류");

    const w1 = u0 * (W1_FACTORS[n1] || 28.6);
    const hole = getInitialHoleNumber(a0, n1);
    const results = findTopTwoCombinations(w1, n1, u0);
    run1_calculated_w1 = w1; run1_recorded_u0 = u0; run1_recorded_a0 = a0; run1_recorded_n1 = n1;
    displayResult("Run 1", n1, u0, a0, w1, hole, results);
}

function calculateRun2() {
    const u1 = parseFloat(document.getElementById('run2_u1').value);
    const a1 = parseFloat(document.getElementById('run2_a1').value);
    if (isNaN(u1) || isNaN(a1)) return alert("Run2 입력 오류");

    const w1 = run1_calculated_w1;
    const u0 = run1_recorded_u0;
    const a0 = run1_recorded_a0;
    const n1 = run1_recorded_n1;
    if (!w1 || !u0 || !a0) return alert("Run1 먼저 실행 필요");

    const rad = d => d * Math.PI / 180;
    const x0 = u0 * Math.cos(rad(a0)), y0 = u0 * Math.sin(rad(a0));
    const x1 = u1 * Math.cos(rad(a1)), y1 = u1 * Math.sin(rad(a1));
    const dx = x1 - x0, dy = y1 - y0;
    const R1 = Math.sqrt(dx**2 + dy**2);

    let cosAngle = (u0**2 + R1**2 - u1**2) / (2 * u0 * R1);
    cosAngle = Math.min(1, Math.max(-1, cosAngle));
    let angle = Math.acos(cosAngle) * 180 / Math.PI;
    const cross = dx * y0 - dy * x0;
    const dir = cross > 0 ? 'CCW' : 'CW';

    const initialHole = getInitialHoleNumber(a0, n1);
    const shift = Math.round(angle / 9.5);
    const newHole = dir === 'CW' ? (initialHole - shift - 1 + 38) % 38 + 1 : (initialHole + shift - 1) % 38 + 1;
    const w2 = w1 * (u0 / R1);
    const results = findTopTwoCombinations(w2, n1, u0);
    displayResult("Run 2", n1, u1, a1, w2, newHole, results);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateRun1Btn')?.addEventListener('click', calculateRun1);
    document.getElementById('calculateRun2Btn')?.addEventListener('click', calculateRun2);
});
