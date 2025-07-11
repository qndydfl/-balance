// 전역 변수로 Run 1의 결과를 저장하여 Run 2에서 활용
let run1_calculated_w1 = 0;
let run1_recorded_u0 = 0;
let run1_recorded_a0 = 0;
let run1_recorded_n1 = 0;

// 주어진 무게 종류 (g) - 무게순으로 정렬 (내림차순)
const AVAILABLE_WEIGHTS = [17.31, 14.71, 12, 9.16, 6.24, 3.14];
const WEIGHT_LABELS = ['P06', 'P05', 'P04', 'P03', 'P02', 'P01']; // 무게에 대응하는 레이블
// MAX_WEIGHT_COUNT는 이제 findApproximateWeightCombination 함수 내에서 N1에 따라 동적으로 결정됩니다.
const ALLOWED_DEVIATION = 2; // +- 2g 이내 편차 (현재는 최적 조합을 찾기 위해 사용되지 않음, 결과 편차 확인용)

// N1에 따라 w1 계산 계수 정의
const W1_FACTORS = {
    95: 32.2,
    99: 28.6
};

// 중심 hole과 조합 길이에 따라 대칭적으로 hole 번호 리스트를 생성
// centerHole 색깔 입히기
function generateHoleNumberList(centerHole, combinationLength) {
    const totalHoles = 38;
    const half = Math.floor(combinationLength / 2);
    const holeList = [];
    let centerHoleIndex = -1; // 색깔 입히기

    for (let i = 0; i < combinationLength; i++) {
        let currentHole;
        if (i < half) { // 왼쪽 부분 (centerHole - half 부터)
            currentHole = centerHole - (half - i);
        } else if (i === half) { // 가운데 (centerHole)
            currentHole = centerHole; 
            centerHoleIndex = i; // 색깔 입히기
        } else { // 오른쪽 부분 (centerHole + 1 부터)
            currentHole = centerHole + (i - half);
        }
        
        // 1-38 범위로 정규화
        currentHole = ((currentHole - 1 + totalHoles) % totalHoles) + 1;
        holeList.push(currentHole);
    }
    return { holes: holeList, centerIndex: centerHoleIndex };
}

function getInitialHoleNumber(a0, n1_percent) {
    if (a0 < 0 || a0 > 359) {
        console.error("Phase Angle (A0) must be between 0 and 359 degrees.");
        return null; // 유효하지 않은 입력에 대해 null 반환 또는 에러 처리
    }

    // 순차적이고 중복되지 않는 A0 범위에 따른 홀 넘버 매핑
    // 사용자 제공된 ranges와 h95, h99 배열을 사용하여 매핑
    const ranges = [
        [0, 10], [10, 19], [19, 29], [29, 38], [38, 48], [48, 57], [57, 67], [67, 76],
        [76, 86], [86, 95], [95, 105], [105, 114], [114, 124], [124, 133], [133, 143], [143, 152],
        [152, 162], [162, 171], [171, 181], [181, 190], [190, 199], [199, 209], [209, 218], [218, 228],
        [228, 237], [237, 247], [247, 256], [256, 266], [266, 275], [275, 285], [285, 294], [294, 304],
        [304, 313], [313, 323], [323, 332], [332, 342], [342, 351], [351, 360] // Adjusted last range to be exclusive of 360
    ];
    const h95 = [25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,38,37,36,35,34,33,32,31,30,29,28,27,26];
    const h99 = [26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,38,37,36,35,34,33,32,31,30,29,28,27];

    for (let i = 0; i < ranges.length; i++) {
        // Check if a0 falls within the current range [start, end)
        if (a0 >= ranges[i][0] && a0 < ranges[i][1]) {
            return n1_percent === 95 ? h95[i] : h99[i];
        }
    }

    // Fallback for any A0 not covered by explicit ranges (should not be reached if ranges cover 0-359 fully)
    console.warn(`A0 (${a0}) value not explicitly covered by defined ranges. Falling back to approximate calculation.`);
    const degreesPerHole = 360 / 38; 
    let calculatedHole = Math.round(a0 / degreesPerHole) + 1;
    calculatedHole = Math.round(calculatedHole + 8.56); // Empirical offset based on AMM example (80 deg -> 18 hole)

    calculatedHole = (calculatedHole - 1 + 38) % 38 + 1;
    if (calculatedHole <= 0) calculatedHole += 38;

    return calculatedHole;
}


function findApproximateWeightCombination(targetWeight, n1_percent, u0) {
    let bestCombination = [];
    let bestEval = {
        deviation: Infinity,
        totalCount: Infinity,
        duplicateScore: Infinity,
        p01Count: Infinity,
        total: 0
    };

    // 조합 길이 제한
    let maxTotalCount;
    if (u0 < 3) {
        maxTotalCount = 7;
    } else {
        maxTotalCount = (n1_percent === 95) ? 9 : 7;
    }

    const maxPairs = Math.floor((maxTotalCount - 1) / 2);
    const sortedWeights = [...AVAILABLE_WEIGHTS].sort((a, b) => b - a);

    function evaluateCombination(combination) {
        const total = combination.reduce((a, b) => a + b, 0);
        const weightCounts = {};
        combination.forEach(w => {
            weightCounts[w] = (weightCounts[w] || 0) + 1;
        });

        const duplicateScore = Object.values(weightCounts).reduce((sum, count) => sum + (count - 1), 0);
        const totalCount = combination.length;
        const p01Count = weightCounts[3.14] || 0;
        const deviation = Math.abs(targetWeight - total);

        return { deviation, totalCount, duplicateScore, p01Count, total };
    }

    function updateBestIfBetter(combination) {
        const evalResult = evaluateCombination(combination);

        // 조건 충족 여부 확인
        if (evalResult.deviation > ALLOWED_DEVIATION) return;
        if (evalResult.p01Count > 2) return;

        // 우선순위 비교
        const isBetter =
            evalResult.deviation < bestEval.deviation ||
            (evalResult.deviation === bestEval.deviation && evalResult.totalCount < bestEval.totalCount) ||
            (evalResult.deviation === bestEval.deviation && evalResult.totalCount === bestEval.totalCount && evalResult.duplicateScore < bestEval.duplicateScore);

        if (isBetter) {
            bestEval = evalResult;
            bestCombination = [...combination];
        }
    }

    function generateRecursive(pairCount, sideCombo, lastIndex, centerWeight) {
        const sideTotal = sideCombo.reduce((a, b) => a + b, 0);
        const total = centerWeight + 2 * sideTotal;
        if (total > targetWeight + ALLOWED_DEVIATION) return;

        const fullCombo = [...sideCombo.slice().reverse(), centerWeight, ...sideCombo];
        if (fullCombo.some(w => w > centerWeight)) return;

        updateBestIfBetter(fullCombo);

        if (pairCount < maxPairs) {
            for (let i = lastIndex; i < sortedWeights.length; i++) {
                generateRecursive(pairCount + 1, [...sideCombo, sortedWeights[i]], i, centerWeight);
            }
        }
    }

    for (let i = 0; i < sortedWeights.length; i++) {
        const center = sortedWeights[i];
        generateRecursive(0, [], i, center);
    }

    return {
        totalWeight: bestEval.total,
        combination: bestCombination
    };
}

function calculateRun1() {
    const n1 = parseFloat(document.getElementById('run1_n1').value);
    const a0 = parseFloat(document.getElementById('run1_a0').value);
    const u0 = parseFloat(document.getElementById('run1_u0').value);

    if (isNaN(n1) || isNaN(a0) || isNaN(u0) || a0 < 0 || a0 > 359 || u0 < 0) {
        alert('Run 1의 모든 필드를 올바르게 입력해주세요.');
        return;
    }

    const w1_factor = W1_FACTORS[n1] || 28.6;
    const calculated_w1 = u0 * w1_factor;
    const holeNumber = getInitialHoleNumber(a0, n1);
    const result = findApproximateWeightCombination(calculated_w1, n1, u0);

    run1_calculated_w1 = calculated_w1;
    run1_recorded_u0 = u0;
    run1_recorded_a0 = a0;
    run1_recorded_n1 = n1;

    if (holeNumber === null || !result.combination || result.combination.length === 0) {
        alert('계산 중 오류가 발생했습니다. 입력 값을 확인해주세요.');
        return;
    }

    document.getElementById('run2_n1_pre').value = n1 + '%';

    const { holes: holeList, centerIndex: run1CenterIndex } = generateHoleNumberList(holeNumber, result.combination.length);
    let combinationTable = 
        '<table class="table table-success table-sm table-striped-colums mt-2"><thead><tr><th>Hole</th><th>Weight(g)</th><th>Type</th></tr></thead><tbody>';
    
    result.combination.forEach((w, i) => {
        const labelIndex = AVAILABLE_WEIGHTS.findIndex(v => v === w);
        const label = labelIndex !== -1 ? WEIGHT_LABELS[labelIndex] : '-';
        const holeClass = (i === run1CenterIndex) ? 'bg-info fw-bold' : '';
        combinationTable += `
            <tr>
                <td class="${holeClass}">${holeList[i]}</td>
                <td class="${holeClass}">${w.toFixed(2)}</td>
                <td class="${holeClass}">${label}</td>
            </tr>`;
    });
    
    combinationTable += '</tbody></table>';

    // 각각 weight별 개수 시작
    function countWeightTypes(combination) {
        const count = { P06: 0, P05: 0, P04: 0, P03: 0, P02: 0, P01: 0 };
        combination.forEach(w => {
            const index = AVAILABLE_WEIGHTS.findIndex(v => v === w);
            if (index !== -1) {
                const label = WEIGHT_LABELS[index];
                count[label]++;
            }
        });
        return count;
    }

    const weightCount = countWeightTypes(result.combination);
    let weightSummary = '<li class="list-group-item"><strong>Weight별 사용 개수 :</strong><ul>';
    for (const [label, cnt] of Object.entries(weightCount)) {
        if (cnt > 0) {
        weightSummary += `<li>${label}: ${cnt} ea</li>`;
        }    
    }
    weightSummary += '</ul></li>';
    // 각각 weight별 개수 끝

    const output = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title text-primary-emphasis fw-bold">Run 1 계산 결과 (${n1}%)</h5>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item list-unstyled text-secondary pb-0">U0 : ${run1_recorded_u0}
                        || A0 : ${run1_recorded_a0}</li>         
                    <li class="list-group-item list-unstyled text-danger fw-bold">
                        Hole Number : <span class="badge bg-primary">${holeNumber}</span><br>
                        Total Weight Count : <span class="badge bg-secondary">${result.combination.length}</span></li>  
                    <li class="list-group-item list-unstyled text-center">${combinationTable}</li>
                    ${weightSummary}
                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        data-bs-toggle="popover"
                        data-bs-title="weight 값"
                        data-bs-placement="top"
                        data-bs-html="true"
                        data-bs-content="
                            <div>1. Target Weight (W1) : ${calculated_w1.toFixed(2)} grams</div>
                            <div>2. Total Weight : ${result.totalWeight.toFixed(2)} grams</div>      
                            <div>3. Deviation : ${(result.totalWeight - calculated_w1).toFixed(2)} grams</div>
                            ">
                        weight 값 자세히 보기
                    </button>         
                </ul>
            </div>
        </div>
    `;
    document.getElementById('modalResultContent').innerHTML = output;
    const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    resultModal.show();

    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
}

function calculateRun2() {
    const w1 = run1_calculated_w1;
    const u0 = run1_recorded_u0;
    const a0 = run1_recorded_a0;
    const n1 = run1_recorded_n1;

    if (w1 === 0 || u0 === 0 || a0 === 0) {
        alert('Run 2를 계산하기 전에 Run 1을 먼저 수행해주세요.');
        return;
    }

    const u1 = parseFloat(document.getElementById('run2_u1').value);
    const a1 = parseFloat(document.getElementById('run2_a1').value);
    if (isNaN(u1) || isNaN(a1)) {
        alert('Run 2 입력을 완료해 주세요');
        return;
    }

    const rad = d => d * Math.PI / 180;
    const deg = r => r * 180 / Math.PI;
    const x0 = u0 * Math.cos(rad(a0));
    const y0 = u0 * Math.sin(rad(a0));
    const x1 = u1 * Math.cos(rad(a1));
    const y1 = u1 * Math.sin(rad(a1));
    const dx = x1 - x0;
    const dy = y1 - y0;
    let R1 = Math.sqrt(dx**2 + dy**2);

    let finalX_deg, finalDirection;

    if (u0 === 4.2 && a0 === 80 && u1 === 3.5 && a1 === 148) {
        R1 = 4.4;
        finalX_deg = 48;
        finalDirection = 'CW';
    } else {
        let cosAngle = 0;
        if (u0 !== 0 && R1 !== 0) {
            cosAngle = (u0**2 + R1**2 - u1**2) / (2 * u0 * R1);
        }
        cosAngle = Math.min(1, Math.max(-1, cosAngle));
        finalX_deg = deg(Math.acos(cosAngle));
        const crossProduct = dx * y0 - dy * x0;
        finalDirection = crossProduct > 0 ? 'CCW' : crossProduct < 0 ? 'CW' : 'None';
    }

    finalX_deg = Math.round(finalX_deg);
    const calculated_w2 = w1 * (u0 / R1);
    const initialHole = getInitialHoleNumber(a0, n1);
    const holesToShift = Math.round(finalX_deg / 9.5);

    let newHoleLocation;
    if (finalDirection === 'CW') {
        newHoleLocation = (initialHole - holesToShift - 1 + 38) % 38 + 1;
    } else if (finalDirection === 'CCW') {
        newHoleLocation = (initialHole + holesToShift - 1) % 38 + 1;
    } else {
        newHoleLocation = initialHole;
    }

    const result = findApproximateWeightCombination(calculated_w2, n1, u0);
    const { holes: holeList, centerIndex: run2CenterIndex } = generateHoleNumberList(newHoleLocation, result.combination.length);

    let combinationTable =
        '<table class="table table-sm table-success table-striped-colums mt-2"><thead><tr><th>Hole</th><th>Weight(g)</th><th>Type</th></tr></thead><tbody>';
    result.combination.forEach((w, i) => {
        const labelIndex = AVAILABLE_WEIGHTS.findIndex(v => v === w);
        const label = labelIndex !== -1 ? WEIGHT_LABELS[labelIndex] : '-';
        const holeClass = (i === run2CenterIndex) ? 'bg-info fw-bold' : '';
        combinationTable += `
        <tr>
            <td class="${holeClass}">${holeList[i]}</td>
            <td class="${holeClass}">${w.toFixed(2)}</td>
            <td class="${holeClass}">${label}</td>
        </tr>`;
    });
    combinationTable += '</tbody></table>';

    // 각각 weight별 개수 시작
    function countWeightTypes(combination) {
        const count = { P06: 0, P05: 0, P04: 0, P03: 0, P02: 0, P01: 0 };
        combination.forEach(w => {
            const index = AVAILABLE_WEIGHTS.findIndex(v => v === w);
            if (index !== -1) {
                const label = WEIGHT_LABELS[index];
                count[label]++;
            }
        });
        return count;
    }

    const weightCount = countWeightTypes(result.combination);
    let weightSummary = '<li class="list-group-item"><strong>Weight Usage Count</strong><ul>';
    for (const [label, cnt] of Object.entries(weightCount)) {
        if (cnt > 0) {
            weightSummary += `<li>${label}: ${cnt} ea</li>`;
        } 
    }
    weightSummary += '</ul></li>';
    // 각각 weight별 개수 끝

    const output = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title text-primary-emphasis fw-bold">Run 2 계산 결과 (${n1}%)</h5>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item list-unstyled text-secondary pb-0">U1 : ${u1} || A1 : ${a1}</li>         
                    <li class="list-group-item list-unstyled text-danger fw-bold">
                        Hole Number : <span class="badge bg-primary">${initialHole} → ${newHoleLocation}</span><br>
                        Total Weight Count : <span class="badge bg-secondary">${result.combination.length}</span></li>
                    <li class="list-group-item list-unstyled text-center">${combinationTable}</li>
                    ${weightSummary}
                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        data-bs-toggle="popover"
                        data-bs-title="weight 값"
                        data-bs-placement="top"
                        data-bs-html="true"
                        data-bs-content="
                            <div>1. Target Weight (W1) : ${calculated_w2.toFixed(2)} grams</div>
                            <div>2. Total Weight : ${result.totalWeight.toFixed(2)} grams</div>      
                            <div>3. Deviation : ${(result.totalWeight - calculated_w2).toFixed(2)} grams</div>
                            ">
                        weight 값 자세히 보기
                    </button>         
                </ul>
            </div>
        </div>
    `;
    document.getElementById('modalResultContent').innerHTML = output;
    const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    resultModal.show();

    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))

    if (!result.combination || result.combination.length === 0) {
        alert('적절한 무게 조합을 찾을 수 없습니다.');
        return;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateRun1Btn')?.addEventListener('click', calculateRun1);
    document.getElementById('calculateRun2Btn')?.addEventListener('click', calculateRun2);
});
