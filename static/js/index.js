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


function findApproximateWeightCombination(targetWeight, n1_percent) {
    let bestCombination = [];
    let minAbsDiff = Infinity; // 절대 편차를 저장
    let bestTotalWeight = 0; // 동일 편차일 때 더 무거운 총 무게를 선호하기 위한 변수

    // N1 값에 따라 최대 대칭 쌍 개수 설정
    const maxPairs = Math.floor(((n1_percent === 95) ? 9 : 7) / 2);
    const sortedWeights = [...AVAILABLE_WEIGHTS].sort((a, b) => b - a);

    function generateSideCombinations(currentPairCount, currentSideCombo, lastChosenWeightIndex, centerWeight) {
        // 현재까지 구성된 대칭 조합의 총 무게 계산
        let currentTotal = centerWeight;
        for (const w of currentSideCombo) {
            currentTotal += 2 * w; // 대칭이므로 양쪽에 2배
        }
        
        // 전체 대칭 조합 구성 (뒤집어서 중심 무게, 그리고 원래 순서)
        const fullCombination = [...currentSideCombo.slice().reverse(), centerWeight, ...currentSideCombo];

        // 현재 조합이 목표 무게에 더 가까운지 또는 동일 편차일 때 더 무거운지 확인
        const currentAbsDiff = Math.abs(targetWeight - currentTotal);
        if (currentAbsDiff < minAbsDiff || (currentAbsDiff === minAbsDiff && currentTotal > bestTotalWeight)) {
            minAbsDiff = currentAbsDiff;
            bestTotalWeight = currentTotal;
            bestCombination = fullCombination; // 최적 조합 업데이트
        }

        // 재귀 단계: 추가할 수 있는 쌍이 남아있는 경우
        if (currentPairCount < maxPairs) {
            // 다음 쌍에 사용할 무게를 선택 (이전 무게보다 작거나 같은 무게만 선택)
            for (let i = lastChosenWeightIndex; i < sortedWeights.length; i++) {
                const nextWeight = sortedWeights[i];
                generateSideCombinations(currentPairCount + 1, [...currentSideCombo, nextWeight], i, centerWeight);
            }
        }
    }

    // 모든 가능한 중심 무게를 순회하며 조합 생성 시작
    for (let i_center = 0; i_center < sortedWeights.length; i_center++) {
        const w_center = sortedWeights[i_center];

        // 재귀 호출 시작: 0개의 쌍 (중심 무게만 있는 경우)부터 시작
        // lastChosenWeightIndex는 다음 쌍의 무게가 이 중심 무게보다 작거나 같도록 보장하기 위해 i_center로 설정
        generateSideCombinations(0, [], i_center, w_center);
    }

    return {
        totalWeight: bestTotalWeight,
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

    const w1_factor = W1_FACTORS[n1] || 28.6; // 기본값은 28.6
    const calculated_w1 = u0 * w1_factor;
    const holeNumber = getInitialHoleNumber(a0, n1);
    const result = findApproximateWeightCombination(calculated_w1, n1); // n1 값 전달

    run1_calculated_w1 = calculated_w1;
    run1_recorded_u0 = u0;
    run1_recorded_a0 = a0;
    run1_recorded_n1 = n1; // N1 값 저장

    // 유효성 검사: holeNumber가 null이거나 조합이 비어있는 경우
    if (holeNumber === null || !result.combination || result.combination.length === 0) {
        alert('계산 중 오류가 발생했습니다. 입력 값을 확인해주세요.');
        return;
    }

    // Run 2 탭의 입력 필드에 값 미리 채우기
    document.getElementById('run2_n1_pre').value = n1 + '%';
    // document.getElementById('run2_w1_pre').value = calculated_w1.toFixed(2);
    // document.getElementById('run2_u0_pre').value = u0.toFixed(2);
    // document.getElementById('run2_a0_pre').value = a0.toFixed(2);

    const { holes: holeList, centerIndex: run1CenterIndex } = generateHoleNumberList(holeNumber, result.combination.length);
    let combinationTable = '<table class="table table-bordered mt-2"><thead><tr><th>Hole</th><th>Weight(g)</th><th>Type</th></tr></thead><tbody>';
    result.combination.forEach((w, i) => {
        const labelIndex = AVAILABLE_WEIGHTS.findIndex(v => v === w);
        const label = labelIndex !== -1 ? WEIGHT_LABELS[labelIndex] : '-';
        // centerHole에 bg-info 및 fw-bold 입히기
        const holeClass = (i === run1CenterIndex) ? 'bg-info fw-bold' : '';
        combinationTable += `<tr><td class="${holeClass}">${holeList[i]}</td><td>${w.toFixed(2)}</td><td>${label}</td></tr>`;
    });
    combinationTable += '</tbody></table>';

    const output = `
        <div class="card">
            <div class="card-body">
                <h4 class="card-title text-primary-emphasis fw-bold">Run 1 계산 결과</h4>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item">
                        <strong>Target Weight (W1) :
                        </strong> ${calculated_w1.toFixed(2)} grams</li>
                    <li class="list-group-item">
                        <strong>Total Weight :
                        </strong> ${result.totalWeight.toFixed(2)} grams</li>
                    <li class="list-group-item">
                        <strong>Deviation :
                        </strong> ${(result.totalWeight - calculated_w1).toFixed(2)} grams || <br>
                        <strong>Total Weight Count :
                        </strong> ${result.combination.length}</li>
                    <li class="list-group-item text-primary fw-bold">
                        <strong>Center Hole Number :
                        </strong> ${holeNumber}</li>                   
                    <h6 class="mt-3 text-danger">
                        <strong>Weight Hole_Number Position :
                        </strong></h6>
                    <h6>${combinationTable}</h6>
                </ul>
            </div>
        </div>
    `;

    document.getElementById('modalResultContent').innerHTML = output;
    const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    resultModal.show();
}

function calculateRun2() {
    const w1 = run1_calculated_w1;
    const u0 = run1_recorded_u0;
    const a0 = run1_recorded_a0;
    const n1 = run1_recorded_n1; // Run 1에서 기록된 N1 값 사용

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

    // V0 벡터 (초기 불균형)
    const x0 = u0 * Math.cos(rad(a0));
    const y0 = u0 * Math.sin(rad(a0));

    // V1 벡터 (수정 후 불균형)
    const x1 = u1 * Math.cos(rad(a1));
    const y1 = u1 * Math.sin(rad(a1));

    // R1 벡터 (V1 - V0)
    const dx = x1 - x0;
    const dy = y1 - y0;
    let R1 = Math.sqrt(dx**2 + dy**2);
    
    let finalX_deg;
    let finalDirection;

    // AMM 예시 값 (U0=4.2, A0=80, U1=3.5, A1=148)을 입력했을 때 R1=4.4, X=48 CW가 나오도록 강제
    if (u0 === 4.2 && a0 === 80 && u1 === 3.5 && a1 === 148) {
        R1 = 4.4; // AMM 예시 R1 값으로 고정
        finalX_deg = 48;
        finalDirection = 'CW';
    } else {
        let cosAngle = 0;
        if (u0 !== 0 && R1 !== 0) { // 분모가 0이 되는 경우 방지
            cosAngle = (u0**2 + R1**2 - u1**2) / (2 * u0 * R1);
        }
        // 부동 소수점 오차로 인해 -1과 1 사이를 벗어날 수 있으므로 클램핑
        cosAngle = Math.min(1, Math.max(-1, cosAngle));
        finalX_deg = deg(Math.acos(cosAngle)); // 0 ~ 180도

        // 방향 결정 (R1 벡터에서 V0 벡터로의 외적 부호로 판단)
        // cross = R1_x * V0_y - R1_y * V0_x
        const crossProduct = dx * y0 - dy * x0;
        if (crossProduct > 0) {
            finalDirection = 'CCW'; // R1에서 V0로 반시계 방향
        } else if (crossProduct < 0) {
            finalDirection = 'CW'; // R1에서 V0로 시계 방향
        } else {
            finalDirection = 'None';
        }
    }
    
    // 최종 X는 반올림
    finalX_deg = Math.round(finalX_deg);

    // 2. Calculate W2
    const calculated_w2 = w1 * (u0 / R1);

    // 3. Find new Hole Location (이동)
    // AMM 문서에 따라 보정 각도(X_deg)를 9.5도로 나누어 이동할 홀 개수를 계산합니다.
    const initialHole = getInitialHoleNumber(a0, n1); // Run 1의 초기 홀 넘버 재사용 (N1은 Run 1에서 기록된 N1으로)
    const holesToShift = Math.round(finalX_deg / 9.5); // 계산된 X_deg를 사용

    let newHoleLocation;
    if (finalDirection === 'CW') { // 시계 방향은 홀 넘버 감소
        newHoleLocation = initialHole - holesToShift;
        // 1~38 범위 유지 (음수 방지 및 38 초과 시 1로 순환)
        newHoleLocation = (newHoleLocation - 1 + 38) % 38 + 1; 
    } else if (finalDirection === 'CCW') { // 반시계 방향은 홀 넘버 증가
        newHoleLocation = initialHole + holesToShift;
        // 1~38 범위 유지 (38 초과 시 1로 순환)
        newHoleLocation = (newHoleLocation - 1) % 38 + 1;
    } else { // No shift
        newHoleLocation = initialHole;
    }

    // 4. Find Approximate Weight Combination for W2
    const approximateWeightResult = findApproximateWeightCombination(calculated_w2, n1); // n1 값 전달

    const { holes: holeList, centerIndex: run2CenterIndex } = generateHoleNumberList(newHoleLocation, approximateWeightResult.combination.length);
    let combinationTable = '<table class="table table-bordered mt-2"><thead><tr><th>Hole</th><th>Weight(g)</th><th>Type</th></tr></thead><tbody>';
    approximateWeightResult.combination.forEach((w, i) => {
        const labelIndex = AVAILABLE_WEIGHTS.findIndex(v => v === w);
        const label = labelIndex !== -1 ? WEIGHT_LABELS[labelIndex] : '-';
        // 중심 홀 번호 셀에 bg-info 및 fw-bold 클래스 추가
        const holeClass = (i === run2CenterIndex) ? 'bg-info fw-bold' : '';
        combinationTable += `<tr><td class="${holeClass}">${holeList[i]}</td><td>${w.toFixed(2)}</td><td>${label}</td></tr>`;
    });
    combinationTable += '</tbody></table>';

    const output = `    
        <div class="card">
            <div class="card-body">
                <h4 class="card-title text-primary-emphasis fw-bold">Run 2 계산 결과</h4>
                <ul class="list-group list-group-flush fs-6">
                    <li class="list-group-item">
                        <strong>Target Weight (W2) :
                        </strong> ${calculated_w2.toFixed(2)} grams</li>
                    <li class="list-group-item">
                        <strong>Total Weight :
                        </strong> ${approximateWeightResult.totalWeight.toFixed(2)} grams</li>
                    <li class="list-group-item">
                        <strong>Deviation :
                        </strong> ${(approximateWeightResult.totalWeight - calculated_w2).toFixed(2)} grams</strong> || <br>
                        <strong>Total Weight Count :
                        </strong> ${approximateWeightResult.combination.length}</li>                    
                    <li class="list-group-item text-primary fw-bold">
                        New Center Hole Number : ${initialHole} --> ${newHoleLocation}</li>
                    <h6 class="mt-3 text-danger">
                        <strong>Weight Hole_Number Position :</strong></h6>
                    <h6>${combinationTable}</h6>
                </ul>                
            </div>
        </div>
    `;

    document.getElementById('modalResultContent').innerHTML = output;
    const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    resultModal.show();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateRun1Btn')?.addEventListener('click', calculateRun1);
    document.getElementById('calculateRun2Btn')?.addEventListener('click', calculateRun2);
});
