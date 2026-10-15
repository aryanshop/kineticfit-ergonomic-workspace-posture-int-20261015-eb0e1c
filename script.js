// KineticFit Core Logic

document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            
            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Ergonomic Calculator Logic
    const userHeightInput = document.getElementById('userHeight');
    const deskHeightInput = document.getElementById('deskHeight');
    const chairHeightInput = document.getElementById('chairHeight');
    const monitorDistInput = document.getElementById('monitorDist');
    const screenHeightSelect = document.getElementById('screenHeight');

    const valUserHeight = document.getElementById('valUserHeight');
    const valDeskHeight = document.getElementById('valDeskHeight');
    const valChairHeight = document.getElementById('valChairHeight');
    const valMonitorDist = document.getElementById('valMonitorDist');

    const scoreValue = document.getElementById('scoreValue');
    const scoreStatus = document.getElementById('scoreStatus');
    const ergonomicFeedback = document.getElementById('ergonomicFeedback');

    function calculateErgonomics() {
        const uH = parseInt(userHeightInput.value);
        const dH = parseInt(deskHeightInput.value);
        const cH = parseInt(chairHeightInput.value);
        const mD = parseInt(monitorDistInput.value);
        const sH = screenHeightSelect.value;

        valUserHeight.textContent = uH;
        valDeskHeight.textContent = dH;
        valChairHeight.textContent = cH;
        valMonitorDist.textContent = mD;

        let score = 100;
        let feedback = [];

        // Ideal calculations based on general ergonomics formulas
        // Ideal chair height: ~26% of user height
        const idealChair = Math.round(uH * 0.26);
        const chairDiff = Math.abs(cH - idealChair);
        if (chairDiff > 4) {
            score -= 20;
            feedback.push({
                type: 'danger',
                icon: '⚠️',
                text: `Seat height (${cH}cm) is suboptimal for your height. Aim for approx. ${idealChair}cm so your feet rest flat on the floor with knees at 90 degrees.`
            });
        } else {
            feedback.push({
                type: 'success',
                icon: '✓',
                text: `Seat height (${cH}cm) is well aligned for your stature.`
            });
        }

        // Ideal desk height relative to chair: chair height + 22 to 28 cm
        const deskDiffFromChair = dH - cH;
        if (deskDiffFromChair < 20 || deskDiffFromChair > 32) {
            score -= 25;
            feedback.push({
                type: 'danger',
                icon: '⚠️',
                text: `Desk height relative to your chair creates poor arm angles. Forearms should be parallel to the floor (elbows at 90-100 degrees).`
            });
        } else {
            feedback.push({
                type: 'success',
                icon: '✓',
                text: `Desk-to-chair clearance promotes comfortable typing posture.`
            });
        }

        // Monitor distance: 50-70 cm
        if (mD < 45 || mD > 80) {
            score -= 15;
            feedback.push({
                type: 'warning',
                icon: 'ℹ',
                text: `Monitor distance (${mD}cm) is outside the recommended 50-70cm range to prevent eye strain.`
            });
        } else {
            feedback.push({
                type: 'success',
                icon: '✓',
                text: `Monitor viewing distance is within optimal range.`
            });
        }

        // Screen height
        if (sH === 'low') {
            score -= 20;
            feedback.push({
                type: 'danger',
                icon: '⚠️',
                text: `Monitor is too low, forcing your neck to flex downwards ('text neck'). Raise the stand or use a riser.`
            });
        } else if (sH === 'high') {
            score -= 15;
            feedback.push({
                type: 'warning',
                icon: 'ℹ',
                text: `Monitor is tilted upwards or too high, causing neck hyperextension.`
            });
        } else {
            feedback.push({
                type: 'success',
                icon: '✓',
                text: `Monitor top alignment correctly preserves neutral cervical spine posture.`
            });
        }

        score = Math.max(0, score);
        scoreValue.textContent = score;

        if (score >= 85) {
            scoreStatus.textContent = 'Excellent Alignment';
            scoreStatus.style.color = 'var(--success)';
        } else if (score >= 60) {
            scoreStatus.textContent = 'Moderate Risk';
            scoreStatus.style.color = 'var(--warning)';
        } else {
            scoreStatus.textContent = 'High Strain Risk';
            scoreStatus.style.color = 'var(--danger)';
        }

        ergonomicFeedback.innerHTML = feedback.map(f => `
            <div class="feedback-item ${f.type}">
                <span class="feedback-icon">${f.icon}</span>
                <span>${f.text}</span>
            </div>
        `).join('');
    }

    [userHeightInput, deskHeightInput, chairHeightInput, monitorDistInput, screenHeightSelect].forEach(el => {
        el.addEventListener('input', calculateErgonomics);
    });

    calculateErgonomics();

    // Pomodoro / Movement Interval Coach Logic
    const WORK_TIME = 25 * 60;
    const BREAK_TIME = 5 * 60;
    let timeLeft = WORK_TIME;
    let timerRunning = false;
    let timerMode = 'work'; // 'work' or 'break'
    let timerInterval = null;

    const timeDisplay = document.getElementById('timeDisplay');
    const startTimerBtn = document.getElementById('startTimerBtn');
    const skipTimerBtn = document.getElementById('skipTimerBtn');
    const resetTimerBtn = document.getElementById('resetTimerBtn');
    const timerModeTitle = document.getElementById('timerModeTitle');
    const timerBadge = document.getElementById('timerBadge');
    const timerProgress = document.getElementById('timerProgress');
    const soundToggle = document.getElementById('soundToggle');
    const breakGuidanceContent = document.getElementById('breakGuidanceContent');

    const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 115;
    timerProgress.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;

    function updateTimerDisplay() {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        const totalDuration = timerMode === 'work' ? WORK_TIME : BREAK_TIME;
        const offset = CIRCLE_CIRCUMFERENCE - (timeLeft / totalDuration) * CIRCLE_CIRCUMFERENCE;
        timerProgress.style.strokeDashoffset = offset;
    }

    function playChime() {
        if (!soundToggle.checked) return;
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
        } catch (e) {
            // AudioContext not allowed or supported without gesture
        }
    }

    const breakExercises = [
        {
            title: "20-20-20 Eye Rest",
            desc: "Look at something 20 feet away for 20 seconds to relax your eye focusing muscles.",
            steps: ["Look away from your monitor", "Focus on a distant object or out a window", "Blink slowly and relax facial muscles"]
        },
        {
            title: "Neck & Shoulder Roll",
            desc: "Release tension accumulated in the trapezius muscles.",
            steps: ["Gently drop your chin to your chest", "Roll your right ear to your right shoulder", "Slowly roll backward and complete smooth circles"]
        },
        {
            title: "Chest Opener Stretch",
            desc: "Counteract slouched desk posture and open up the chest.",
            steps: ["Interlace your fingers behind your back", "Straighten your arms and lift your chest upward", "Breathe deeply for 30 seconds"]
        },
        {
            title: "Seated Spinal Twist",
            desc: "Restore mobility to the mid-back and spine.",
            steps: ["Sit tall in your chair, feet flat", "Place right hand on left knee and twist gently to the left", "Hold for 15 seconds, then switch sides"]
        }
    ];

    function triggerBreakMode() {
        timerMode = 'break';
        timeLeft = BREAK_TIME;
        timerModeTitle.textContent = 'Active Break';
        timerBadge.textContent = 'Stretch & Move';
        timerBadge.style.background = 'rgba(52, 211, 153, 0.1)';
        timerBadge.style.color = 'var(--success)';
        startTimerBtn.textContent = 'Start Break';

        const randomExercise = breakExercises[Math.floor(Math.random() * breakExercises.length)];
        
        breakGuidanceContent.innerHTML = `
            <div class="active-workout">
                <h3>${randomExercise.title}</h3>
                <p>${randomExercise.desc}</p>
                <ol style="padding-left: 1.25rem; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
                    ${randomExercise.steps.map(s => `<li>${s}</li>`).join('')}
                </ol>
                <div class="workout-timer-large" id="workoutTimerDisplay">05:00</div>
                <button id="doneBreakBtn" class="btn btn-primary" style="width: 100%;">I'm Done Stretching / Resume Focus</button>
            </div>
        `;

        document.getElementById('doneBreakBtn').addEventListener('click', () => {
            resetToWorkMode();
        });

        playChime();
    }

    function resetToWorkMode() {
        timerMode = 'work';
        timeLeft = WORK_TIME;
        timerModeTitle.textContent = 'Focus Session';
        timerBadge.textContent = 'Work';
        timerBadge.style.background = 'rgba(56, 189, 248, 0.1)';
        timerBadge.style.color = 'var(--accent)';
        startTimerBtn.textContent = 'Start Focus';
        timerRunning = false;
        clearInterval(timerInterval);
        updateTimerDisplay();

        breakGuidanceContent.innerHTML = `
            <div class="placeholder-state">
                <div class="pulse-icon"></div>
                <p>Focus timer is running. When the break arrives, guided exercises will appear here automatically!</p>
            </div>
        `;
    }

    function timerTick() {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
            if (timerMode === 'break') {
                const wDisp = document.getElementById('workoutTimerDisplay');
                if (wDisp) {
                    const mins = Math.floor(timeLeft / 60);
                    const secs = timeLeft % 60;
                    wDisp.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }
            }
        } else {
            clearInterval(timerInterval);
            timerRunning = false;
            playChime();
            if (timerMode === 'work') {
                triggerBreakMode();
            } else {
                resetToWorkMode();
            }
        }
    }

    startTimerBtn.addEventListener('click', () => {
        if (!timerRunning) {
            timerRunning = true;
            startTimerBtn.textContent = 'Pause';
            timerInterval = setInterval(timerTick, 1000);
        } else {
            timerRunning = false;
            startTimerBtn.textContent = timerMode === 'work' ? 'Resume Focus' : 'Resume Break';
            clearInterval(timerInterval);
        }
    });

    skipTimerBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerRunning = false;
        if (timerMode === 'work') {
            triggerBreakMode();
        } else {
            resetToWorkMode();
        }
        updateTimerDisplay();
    });

    resetTimerBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerRunning = false;
        resetToWorkMode();
    });

    updateTimerDisplay();

    // Stretch Library & Modal Logic
    const stretches = [
        {
            id: 1,
            title: "Neck Lateral Flexion",
            tag: "Neck & Shoulders",
            desc: "Relieves tension in the side of the neck and upper traps.",
            steps: [
                "Sit tall and relax your shoulders.",
                "Bring your right ear toward your right shoulder gently.",
                "Hold for 15-30 seconds without forcing.",
                "Return to center and switch sides."
            ]
        },
        {
            id: 2,
            title: "Chest Opener & Upper Back",
            tag: "Posture Reset",
            desc: "Combats rounded shoulders from typing.",
            steps: [
                "Clasp your hands behind your lower back or chair back.",
                "Roll your shoulders back and press your chest outward.",
                "Breathe into your upper chest for 30 seconds."
            ]
        },
        {
            id: 3,
            title: "Wrist & Flexor Stretch",
            tag: "Forearms & Wrists",
            desc: "Prevents repetitive strain injuries from mouse and keyboard use.",
            steps: [
                "Extend your right arm forward with palm facing out (stop sign).",
                "Use your left hand to gently pull fingers back toward your body.",
                "Hold for 20 seconds, then point fingers down and press gently."
            ]
        },
        {
            id: 4,
            title: "Seated Thoracic Rotation",
            tag: "Spine Mobility",
            desc: "Eases stiffness in the mid-back caused by prolonged sitting.",
            steps: [
                "Sit sideways or square in your chair.",
                "Rotate your torso to grip the backrest with both hands.",
                "Glowingly deepen the twist on each exhale for 15 seconds per side."
            ]
        },
        {
            id: 5,
            title: "Hip Flexor & Glute Reset",
            tag: "Lower Body",
            desc: "Reactivates dormant lower body muscles from sitting.",
            steps: [
                "Stand up from your desk securely.",
                "Take a wide stance and gently lunge side to side.",
                "Perform 5 slow bodyweight squats or standing hip circles."
            ]
        },
        {
            id: 6,
            title: "Scapular Squeeze",
            tag: "Upper Back",
            desc: "Strengthens posture muscles between the shoulder blades.",
            steps: [
                "Sit or stand tall with arms bent at 90 degrees at your sides.",
                "Squeeze your shoulder blades together as if holding a pencil.",
                "Hold for 5 seconds, repeat 8 times."
            ]
        }
    ];

    const stretchGrid = document.getElementById('stretchGrid');
    const stretchModal = document.getElementById('stretchModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalSteps = document.getElementById('modalSteps');
    const stretchTimerVal = document.getElementById('stretchTimerVal');
    const startStretchTimerBtn = document.getElementById('startStretchTimerBtn');

    let activeStretchInterval = null;
    let stretchTimeLeft = 30;

    function renderStretchLibrary() {
        stretchGrid.innerHTML = stretches.map(s => `
            <div class="stretch-card" data-id="${s.id}">
                <div>
                    <span class="stretch-tag">${s.tag}</span>
                    <h3>${s.title}</h3>
                    <p>${s.desc}</p>
                </div>
                <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--accent); font-weight: 600;">View Guide &rarr;</div>
            </div>
        `).join('');

        document.querySelectorAll('.stretch-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                const stretch = stretches.find(item => item.id == id);
                if (stretch) openStretchModal(stretch);
            });
        });
    }

    function openStretchModal(stretch) {
        modalTitle.textContent = stretch.title;
        modalSteps.innerHTML = stretch.steps.map(st => `<li>${st}</li>`).join('');
        stretchTimeLeft = 30;
        stretchTimerVal.textContent = stretchTimeLeft;
        startStretchTimerBtn.textContent = 'Start Timer';
        if (activeStretchInterval) clearInterval(activeStretchInterval);
        
        stretchModal.classList.add('open');
        stretchModal.setAttribute('aria-hidden', 'false');
    }

    function closeStretchModal() {
        stretchModal.classList.remove('open');
        stretchModal.setAttribute('aria-hidden', 'true');
        if (activeStretchInterval) clearInterval(activeStretchInterval);
    }

    closeModalBtn.addEventListener('click', closeStretchModal);
    stretchModal.addEventListener('click', (e) => {
        if (e.target === stretchModal) closeStretchModal();
    });

    startStretchTimerBtn.addEventListener('click', () => {
        if (activeStretchInterval) clearInterval(activeStretchInterval);
        stretchTimeLeft = 30;
        stretchTimerVal.textContent = stretchTimeLeft;
        startStretchTimerBtn.textContent = 'Running...';

        activeStretchInterval = setInterval(() => {
            stretchTimeLeft--;
            stretchTimerVal.textContent = stretchTimeLeft;
            if (stretchTimeLeft <= 0) {
                clearInterval(activeStretchInterval);
                startStretchTimerBtn.textContent = 'Done!';
                playChime();
            }
        }, 1000);
    });

    renderStretchLibrary();
});
