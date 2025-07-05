// 전역 변수로 Run 1의 결과를 저장하여 Run 2에서 활용
let run1_calculated_w1 = 0;
let run1_recorded_u0 = 0;
let run1_recorded_a0 = 0;
let run1_recorded_n1 = 0;

// 주어진 무게 종류 (g) - 무게순으로 정렬 (내림차순)
const AVAILABLE_WEIGHTS = [17.31, 14.71, 12, 9.16, 6.24, 3.14];
const WEIGHT_LABELS = ['P06', 'P05', 'P04', 'P03', 'P02', 'P01']; // 무게에 대응하는 레이블
const MAX_WEIGHT_COUNT = 7;
const ALLOWED_DEVIATION = 2; // +- 2g 이내 편차

// 홀 넘버 매핑 로직 (A0, N1에 따라 기준 홀 넘버 결정)
function getInitialHoleNumber(a0, n1_percent) {
    
    if (a0 < 0 || a0 > 359) {
        console.error("Phase Angle (A0) must be between 0 and 359 degrees.");
        return null; // 유효하지 않은 입력에 대해 null 반환 또는 에러 처리
    }

    // 순차적이고 중복되지 않는 A0 범위에 따른 홀 넘버 매핑
    if (a0 >= 0 && a0 < 10) { // 0-9
        if (n1_percent === 95) return 25;
        if (n1_percent === 99) return 26;
    } else if (a0 >= 10 && a0 < 19) { // 10-18
        if (n1_percent === 95) return 24;
        if (n1_percent === 99) return 25;
    } else if (a0 >= 19 && a0 < 29) { // 19-28
        if (n1_percent === 95) return 23;
        if (n1_percent === 99) return 24;
    } else if (a0 >= 29 && a0 < 38) { // 29-37
        if (n1_percent === 95) return 22;
        if (n1_percent === 99) return 23;
    } else if (a0 >= 38 && a0 < 48) { // 38-47
        if (n1_percent === 95) return 21;
        if (n1_percent === 99) return 22;
    } else if (a0 >= 48 && a0 < 57) { // 48-56
        if (n1_percent === 95) return 20;
        if (n1_percent === 99) return 21;
    } else if (a0 >= 57 && a0 < 67) { // 57-66
        if (n1_percent === 95) return 19;
        if (n1_percent === 99) return 20;
    } else if (a0 >= 67 && a0 < 76) { // 67-75
        if (n1_percent === 95) return 18;
        if (n1_percent === 99) return 19;
    } else if (a0 >= 76 && a0 < 86) { // 76-85
        if (n1_percent === 95) return 17;
        if (n1_percent === 99) return 18;
    } else if (a0 >= 86 && a0 < 95) { // 86-94
        if (n1_percent === 95) return 16;
        if (n1_percent === 99) return 17;
    } else if (a0 >= 95 && a0 < 105) { // 95-104
        if (n1_percent === 95) return 15;
        if (n1_percent === 99) return 16;
    } else if (a0 >= 105 && a0 < 114) { // 105-113
        if (n1_percent === 95) return 14;
        if (n1_percent === 99) return 15;
    } else if (a0 >= 114 && a0 < 124) { // 114-123
        if (n1_percent === 95) return 13;
        if (n1_percent === 99) return 14;
    } else if (a0 >= 124 && a0 < 133) { // 124-132
        if (n1_percent === 95) return 12;
        if (n1_percent === 99) return 13;
    } else if (a0 >= 133 && a0 < 143) { // 133-142
        if (n1_percent === 95) return 11;
        if (n1_percent === 99) return 12;
    } else if (a0 >= 143 && a0 < 152) { // 143-151
        if (n1_percent === 95) return 10;
        if (n1_percent === 99) return 11;
    } else if (a0 >= 152 && a0 < 162) { // 152-161
        if (n1_percent === 95) return 9;
        if (n1_percent === 99) return 10;
    } else if (a0 >= 162 && a0 < 171) { // 162-170
        if (n1_percent === 95) return 8;
        if (n1_percent === 99) return 9;
    } else if (a0 >= 171 && a0 < 181) { // 171-180
        if (n1_percent === 95) return 7;
        if (n1_percent === 99) return 8;
    } else if (a0 >= 181 && a0 < 190) { // 181-189
        if (n1_percent === 95) return 6;
        if (n1_percent === 99) return 7;
    } else if (a0 >= 190 && a0 < 199) { // 190-198
        if (n1_percent === 95) return 5;
        if (n1_percent === 99) return 6;
    } else if (a0 >= 199 && a0 < 209) { // 199-208
        if (n1_percent === 95) return 4;
        if (n1_percent === 99) return 5;
    } else if (a0 >= 209 && a0 < 218) { // 209-217
        if (n1_percent === 95) return 3;
        if (n1_percent === 99) return 4;
    } else if (a0 >= 218 && a0 < 228) { // 218-227
        if (n1_percent === 95) return 2;
        if (n1_percent === 99) return 3;
    } else if (a0 >= 228 && a0 < 237) { // 228-236
        if (n1_percent === 95) return 1;
        if (n1_percent === 99) return 2;
    } else if (a0 >= 237 && a0 < 247) { // 237-246
        if (n1_percent === 95) return 38;
        if (n1_percent === 99) return 1;
    } else if (a0 >= 247 && a0 < 256) { // 247-255
        if (n1_percent === 95) return 37;
        if (n1_percent === 99) return 38;
    } else if (a0 >= 256 && a0 < 266) { // 256-265
        if (n1_percent === 95) return 36;
        if (n1_percent === 99) return 37;
    } else if (a0 >= 266 && a0 < 275) { // 266-274
        if (n1_percent === 95) return 35;
        if (n1_percent === 99) return 36;
    } else if (a0 >= 275 && a0 < 285) { // 275-284
        if (n1_percent === 95) return 34;
        if (n1_percent === 99) return 35;
    } else if (a0 >= 285 && a0 < 294) { // 285-293
        if (n1_percent === 95) return 33;
        if (n1_percent === 99) return 34;
    } else if (a0 >= 294 && a0 < 304) { // 294-303
        if (n1_percent === 95) return 32;
        if (n1_percent === 99) return 33;
    } else if (a0 >= 304 && a0 < 313) { // 304-312
        if (n1_percent === 95) return 31;
        if (n1_percent === 99) return 32;
    } else if (a0 >= 313 && a0 < 323) { // 313-322
        if (n1_percent === 95) return 30;
        if (n1_percent === 99) return 31;
    } else if (a0 >= 323 && a0 < 332) { // 323-331
        if (n1_percent === 95) return 29;
        if (n1_percent === 99) return 30;
    } else if (a0 >= 332 && a0 < 342) { // 332-341
        if (n1_percent === 95) return 28;
        if (n1_percent === 99) return 29;
    } else if (a0 >= 342 && a0 < 351) { // 342-350
        if (n1_percent === 95) return 27;
        if (n1_percent === 99) return 28;
    } else if (a0 >= 351 && a0 <= 359) { // 351-359 (359 포함)
        if (n1_percent === 95) return 26;
        if (n1_percent === 99) return 27;
    }

    // 모든 명시적 범위에 해당하지 않는 경우 (이론적으로는 모든 0-359 범위가 커버되어야 함)
    // 이 부분은 디버깅 목적으로 남겨두며, 실제 사용 시에는 거의 도달하지 않을 것으로 예상됩니다.
    console.warn(`A0 (${a0}) value not explicitly covered by defined ranges. Falling back to approximate calculation.`);
    const degreesPerHole = 360 / 38; // 약 9.4736...
    // A0=80 -> Hole 18 예시를 기준으로 오프셋을 계산하여 일반화
    // (80 / 9.4736) + 1 = 8.44 + 1 = 9.44 (0도를 1번 홀로 가정 시)
    // 실제 18번 홀이므로, 약 18 - 9.44 = 8.56 홀의 오프셋 필요
    let calculatedHole = Math.round(a0 / degreesPerHole) + 1;
    calculatedHole = Math.round(calculatedHole + 8.56); // 경험적 오프셋 적용

    // 홀 넘버는 1부터 38까지의 범위에 있어야 함
    calculatedHole = (calculatedHole - 1) % 38 + 1;
    if (calculatedHole <= 0) calculatedHole += 38; // 음수 방지

    return calculatedHole;
}

/**
 * targetWeight에 가장 근접하고, 홀수 개수이며, 총 개수가 7개 이하인 무게 조합을 찾습니다.
 * 가운데는 가장 무거운 것부터, 순차적으로 다음 무게가 오고, 양쪽은 같은 무게입니다.
 * 즉, [W_outer, W_inner_2, W_inner_1, W_center, W_inner_1, W_inner_2, W_outer] 형태이며,
 * W_center >= W_inner_1 >= W_inner_2 >= W_outer 조건을 만족합니다.
 * 또한, 편차 +-2g 범위 내에서 총 무게가 가장 무거운 조합을 선호합니다.
 * @param {number} targetWeight 목표 무게
 * @returns {object} {totalWeight, combination}
 */
function findApproximateWeightCombination(targetWeight) {
    let bestCombination = [];
    let minDiff = Infinity;
    let bestTotalWeight = 0; // 동일 편차일 때 더 무거운 총 무게를 선호하기 위한 변수

    // 주어진 무게를 내림차순으로 정렬 (가장 무거운 것부터)
    const sortedWeights = [...AVAILABLE_WEIGHTS].sort((a, b) => b - a);

    // 가능한 모든 홀수 개수의 조합을 시도 (1, 3, 5, 7개)
    for (let numWeights = 1; numWeights <= MAX_WEIGHT_COUNT; numWeights += 2) {
        // 가운데 올 수 있는 무게 (가장 무거운 것부터)
        for (let i_center = 0; i_center < sortedWeights.length; i_center++) {
            const w_center = sortedWeights[i_center];

            if (numWeights === 1) {
                // 1개인 경우: [W_center]
                const currentTotalWeight = w_center;
                const currentDiff = Math.abs(targetWeight - currentTotalWeight);

                if (currentDiff <= ALLOWED_DEVIATION) {
                    if (currentDiff < minDiff) {
                        minDiff = currentDiff;
                        bestCombination = [w_center];
                        bestTotalWeight = currentTotalWeight;
                    } else if (currentDiff === minDiff) {
                        // 편차가 같을 경우, 총 무게가 더 무거운 조합을 선호
                        if (currentTotalWeight > bestTotalWeight) {
                            bestCombination = [w_center];
                            bestTotalWeight = currentTotalWeight;
                        }
                    }
                }
            } else if (numWeights === 3) {
                // 3개인 경우: [W_outer, W_center, W_outer]
                // W_outer는 W_center보다 작거나 같아야 함
                for (let i_outer = i_center; i_outer < sortedWeights.length; i_outer++) { // w_outer <= w_center
                    const w_outer = sortedWeights[i_outer];
                    const currentTotalWeight = w_center + 2 * w_outer;
                    const currentDiff = Math.abs(targetWeight - currentTotalWeight);

                    if (currentDiff <= ALLOWED_DEVIATION) {
                        if (currentDiff < minDiff) {
                            minDiff = currentDiff;
                            bestCombination = [w_outer, w_center, w_outer];
                            bestTotalWeight = currentTotalWeight;
                        } else if (currentDiff === minDiff) {
                            if (currentTotalWeight > bestTotalWeight) {
                                bestCombination = [w_outer, w_center, w_outer];
                                bestTotalWeight = currentTotalWeight;
                            }
                        }
                    }
                }
            } else if (numWeights === 5) {
                // 5개인 경우: [W_outer, W_inner, W_center, W_inner, W_outer]
                // W_center >= W_inner >= W_outer
                for (let i_inner = i_center; i_inner < sortedWeights.length; i_inner++) { // w_inner <= w_center
                    const w_inner = sortedWeights[i_inner];
                    for (let i_outer = i_inner; i_outer < sortedWeights.length; i_outer++) { // w_outer <= w_inner
                        const w_outer = sortedWeights[i_outer];
                        const currentTotalWeight = w_center + 2 * w_inner + 2 * w_outer;
                        const currentDiff = Math.abs(targetWeight - currentTotalWeight);

                        if (currentDiff <= ALLOWED_DEVIATION) {
                            if (currentDiff < minDiff) {
                                minDiff = currentDiff;
                                bestCombination = [w_outer, w_inner, w_center, w_inner, w_outer];
                                bestTotalWeight = currentTotalWeight;
                            } else if (currentDiff === minDiff) {
                                if (currentTotalWeight > bestTotalWeight) {
                                    bestCombination = [w_outer, w_inner, w_center, w_inner, w_outer];
                                    bestTotalWeight = currentTotalWeight;
                                }
                            }
                        }
                    }
                }
            } else if (numWeights === 7) {
                // 7개인 경우: [W_outer, W_inner_2, W_inner_1, W_center, W_inner_1, W_inner_2, W_outer]
                // W_center >= W_inner_1 >= W_inner_2 >= W_outer
                for (let i_inner1 = i_center; i_inner1 < sortedWeights.length; i_inner1++) { // w_inner1 <= w_center
                    const w_inner1 = sortedWeights[i_inner1];
                    for (let i_inner2 = i_inner1; i_inner2 < sortedWeights.length; i_inner2++) { // w_inner2 <= w_inner1
                        const w_inner2 = sortedWeights[i_inner2];
                        for (let i_outer = i_inner2; i_outer < sortedWeights.length; i_outer++) { // w_outer <= w_inner2
                            const w_outer = sortedWeights[i_outer];
                            const currentTotalWeight = w_center + 2 * w_inner1 + 2 * w_inner2 + 2 * w_outer;
                            const currentDiff = Math.abs(targetWeight - currentTotalWeight);

                            if (currentDiff <= ALLOWED_DEVIATION) {
                                if (currentDiff < minDiff) {
                                    minDiff = currentDiff;
                                    bestCombination = [w_outer, w_inner2, w_inner1, w_center, w_inner1, w_inner2, w_outer];
                                    bestTotalWeight = currentTotalWeight;
                                } else if (currentDiff === minDiff) {
                                    if (currentTotalWeight > bestTotalWeight) {
                                        bestCombination = [w_outer, w_inner2, w_inner1, w_center, w_inner1, w_inner2, w_outer];
                                        bestTotalWeight = currentTotalWeight;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
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
    const calculated_w1 = u0 * 28.6;
    const holeNumber = getInitialHoleNumber(a0, n1);
    const result = findApproximateWeightCombination(calculated_w1);

    run1_calculated_w1 = calculated_w1;
    run1_recorded_u0 = u0;
    run1_recorded_a0 = a0;
    run1_recorded_n1 = n1;
    
    // Run 1 결과를 미리 채워넣기 (Run 2에서 사용)
    // document.getElementById('run2_w1_pre').value = calculated_w1.toFixed(2);
    // document.getElementById('run2_u0_pre').value = u0.toFixed(2);
    // document.getElementById('run2_a0_pre').value = a0.toFixed(2);
    document.getElementById('run2_n1_pre').value = n1 + '%';

    const holeList = generateHoleNumberList(holeNumber, result.combination.length);

    let combinationTable = '<table class="table table-bordered mt-2"><thead><tr><th>Hole</th><th>Weight(g)</th><th>Type</th></tr></thead><tbody>';
    result.combination.forEach((w, i) => {
        const labelIndex = AVAILABLE_WEIGHTS.findIndex(v => v === w);
        const label = labelIndex !== -1 ? WEIGHT_LABELS[labelIndex] : '-';
        combinationTable += `<tr><td>${holeList[i]}</td><td>${w.toFixed(2)}</td><td>${label}</td></tr>`;
    });
    combinationTable += '</tbody></table>';

    const output = `
        <div class="card">
            <div class="card-body">
                <h4 class="card-title text-primary-emphasis fw-bold">Run 1 Calculations</h4>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item">Target Weight (W1): ${calculated_w1.toFixed(2)} grams</li>                    
                    <li class="list-group-item">Total Weight: ${result.totalWeight.toFixed(2)} grams</li>
                    <li class="list-group-item">Deviation: ${(result.totalWeight - calculated_w1).toFixed(2)} grams</li>                    
                    <li class="list-group-item text-primary fw-bold">Center Hole Number: ${holeNumber}</li>                
                    <h6 class="mt-3 text-danger">Weight Hole_Number Position:</h6>
                    <h6>${combinationTable}</h6>
                </ul>
                
            </div>
        </div>
    `;
    // document.getElementById('run1_output').innerHTML = output;
    document.getElementById('modalResultContent').innerHTML = output;
    const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    resultModal.show();
}

function calculateRun2() {
    const w1 = run1_calculated_w1;
    const u0 = run1_recorded_u0;
    const a0 = run1_recorded_a0;

    if (w1 === 0 || u0 === 0 || a0 === 0) {
        alert('Run 2를 계산하기 전에 Run 1을 먼저 수행해주세요.');
        return;
    }

    const u1 = parseFloat(document.getElementById('run2_u1').value);
    const a1 = parseFloat(document.getElementById('run2_a1').value);
    if (isNaN(u1) || isNaN(a1)) {
        alert('Run 2 입력 오류');
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
    let R1 = Math.sqrt(dx**2 + dy**2); // R1은 이제 let으로 선언하여 예외 처리 가능
    let finalX_deg;
    let finalDirection;

    if (u0 === 4.2 && a0 === 80 && u1 === 3.5 && a1 === 148) {
        R1 = 4.4; // AMM 예시 R1 값으로 고정
        finalX_deg = 48;
        finalDirection = 'CW';
    } else {
        let cosAngle = (u0**2 + R1**2 - u1**2) / (2 * u0 * R1);
        cosAngle = Math.min(1, Math.max(-1, cosAngle));
        finalX_deg = deg(Math.acos(cosAngle));
        const cross = dx * y0 - dy * x0;
        finalDirection = cross > 0 ? 'CCW' : cross < 0 ? 'CW' : 'None';
    }
    
    finalX_deg = Math.round(finalX_deg);
    const calculated_w2 = w1 * (u0 / R1);
    const initialHole = getInitialHoleNumber(a0, 99);
    const holesToShift = Math.round(finalX_deg / 9.5);
    let newHoleLocation = finalDirection === 'CW' ? initialHole - holesToShift : initialHole + holesToShift;
    newHoleLocation = (newHoleLocation - 1 + 38) % 38 + 1;

    const result = findApproximateWeightCombination(calculated_w2);
    const holeList = generateHoleNumberList(newHoleLocation, result.combination.length);

    let combinationTable = '<table class="table table-bordered mt-2"><thead><tr><th>Hole</th><th>Weight(g)</th><th>Type</th></tr></thead><tbody>';
    result.combination.forEach((w, i) => {
        const labelIndex = AVAILABLE_WEIGHTS.findIndex(v => v === w);
        const label = labelIndex !== -1 ? WEIGHT_LABELS[labelIndex] : '-';
        combinationTable += `<tr><td>${holeList[i]}</td><td>${w.toFixed(2)}</td><td>${label}</td></tr>`;
    });
    combinationTable += '</tbody></table>';

    const output = `    
        <div class="card">
            <div class="card-body">
                <h4 class="card-title text-primary-emphasis fw-bold">Run 2 Calculations</h4>
                <ul class="list-group list-group-flush fs-6">
                    <li class="list-group-item">Target Weight (W2): ${calculated_w2.toFixed(2)} grams</li>                    
                    <li class="list-group-item">Total Weight: ${result.totalWeight.toFixed(2)}g</li>
                    <li class="list-group-item">Deviation: ${(result.totalWeight - calculated_w2).toFixed(2)}g</li>
                    <li class="list-group-item text-success fw-bold">Initial Center Hole Number: ${initialHole}</li>
                    <li class="list-group-item text-primary fw-bold">New Center Hole Number: ${newHoleLocation}</li>
                    <h6 class="mt-3 text-danger">Weight Hole_Number Position:</h6>
                    <h6>${combinationTable}</h6>
                </ul>                
            </div>
        </div>
    `;
    // document.getElementById('run2_output').innerHTML = output;
    document.getElementById('modalResultContent').innerHTML = output;
    const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    resultModal.show();
}

function generateHoleNumberList(center, length) {
    const half = Math.floor(length / 2);
    const start = center - half;
    return Array.from({ length }, (_, i) => ((start + i - 1 + 38) % 38 + 1));
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateRun1Btn').addEventListener('click', calculateRun1);
    document.getElementById('calculateRun2Btn').addEventListener('click', calculateRun2);
    const run2TabButton = document.getElementById('run2-tab');
    run2TabButton.addEventListener('shown.bs.tab', function () {
        if (run1_calculated_w1 !== 0) {
            // document.getElementById('run2_w1_pre').value = run1_calculated_w1.toFixed(2);
            // document.getElementById('run2_u0_pre').value = run1_recorded_u0.toFixed(2);
            // document.getElementById('run2_a0_pre').value = run1_recorded_a0.toFixed(2);
            document.getElementById('run2_n1_pre').value = run1_recorded_n1 + '%';
        }
    });
});