// ===== Application State =====
let grants = [];
let institutions = [];
let currentUser = 'student1';
let currentRole = 'student';
let userStatus = 'public'; // 'public', 'student', 'committee', 'institution'
let walletConnected = false;
let committeeVotesToday = 0;
let currentFilter = 'all';
let institutionsView = 'grid';
let ethToUsdRate = 2500; // Mock rate, will be updated from API
let sponsors = [];
let achievements = [];
let rewards = [];
let userProgress = {
    achievements: 0,
    rewards: 0,
    points: 0,
    level: 1
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadSampleData();
});

function initializeApp() {
    // Load user status from localStorage
    const savedStatus = localStorage.getItem('userStatus');
    if (savedStatus) {
        userStatus = savedStatus;
    }
    
    updateUserStatus();
    updateDemoButtons();
    updateStudentView();
    updateTabIndicator();
    setupFormValidation();
    updateCurrencyRates();
    loadSponsors();
    loadAchievements();
    loadRewards();
    updateGamingView();
    applyAccessRestrictions();
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Navigation tabs (improved)
    document.querySelectorAll('.nav-tab').forEach((tab, index) => {
        tab.removeEventListener('click', tab._navClick);
        const handler = function() {
            const role = this.getAttribute('data-role');
            switchRole(role, index);
        };
        tab.addEventListener('click', handler);
        // keep reference for potential removal
        tab._navClick = handler;
    });

    // Wallet connect button (if present)
    const walletBtn = document.querySelector('.btn-wallet');
    if (walletBtn) {
        walletBtn.removeEventListener('click', walletBtn._walletClick);
        const wHandler = function() { connectWallet(); };
        walletBtn.addEventListener('click', wHandler);
        walletBtn._walletClick = wHandler;
    }

    // Form submission
    const grantForm = document.getElementById('grantForm');
    if (grantForm) {
        grantForm.removeEventListener('submit', grantForm._submitHandler);
        grantForm.addEventListener('submit', submitGrant);
        grantForm._submitHandler = submitGrant;
    }

    // Character counter
    const descField = document.getElementById('projectDesc');
    if (descField) {
        descField.removeEventListener('input', descField._charHandler);
        const charHandler = function() {
            const count = this.value.length;
            document.getElementById('charCount').textContent = count;
            if (count > 500) {
                this.value = this.value.substring(0, 500);
                document.getElementById('charCount').textContent = 500;
            }
        };
        descField.addEventListener('input', charHandler);
        descField._charHandler = charHandler;
    }

    // Filter pills
    document.querySelectorAll('.pill').forEach(btn => {
        btn.removeEventListener('click', btn._pillHandler);
        const pillHandler = function() {
            document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            updateStudentView();
        };
        btn.addEventListener('click', pillHandler);
        btn._pillHandler = pillHandler;
    });

    // Search
    const searchInput = document.getElementById('searchPublic');
    if (searchInput) {
        searchInput.removeEventListener('input', searchInput._searchHandler);
        const searchHandler = function() { filterPublicGrants(this.value); };
        searchInput.addEventListener('input', searchHandler);
        searchInput._searchHandler = searchHandler;
    }

    // View toggle for institutions
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.removeEventListener('click', btn._toggleHandler);
        const toggleHandler = function() {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            institutionsView = this.getAttribute('data-view');
            updateInstitutionsView();
        };
        btn.addEventListener('click', toggleHandler);
        btn._toggleHandler = toggleHandler;
    });

    // Window resize -> update tab indicator
    window.removeEventListener('resize', window._tabResizeHandler);
    const resizeHandler = function() { updateTabIndicator(); };
    window.addEventListener('resize', resizeHandler);
    window._tabResizeHandler = resizeHandler;
}

// ===== Tab Indicator Animation =====
function updateTabIndicator() {
    const indicator = document.querySelector('.tab-indicator');
    const activeTab = document.querySelector('.nav-tab.active');
    if (!indicator || !activeTab) return;

    const left = activeTab.offsetLeft;
    const width = activeTab.offsetWidth;

    // Use transform for smoother animation
    indicator.style.width = `${width}px`;
    indicator.style.left = '0px';
    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), width 0.35s ease';
}

// ===== Role Switching with Animation =====
function switchRole(role, index) {
    currentRole = role;

    // Update tabs
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`[data-role="${role}"]`);
    if (activeTab) activeTab.classList.add('active');

    // Update tab indicator
    updateTabIndicator();

    // Instantly hide all content areas (no animation)
    document.querySelectorAll('.content-area').forEach(area => {
        area.style.display = 'none';
        area.style.opacity = '0';
        area.classList.remove('active');
    });

    // Smoothly reveal the target view using requestAnimationFrame
    const targetView = document.getElementById(`${role}-view`);
    if (!targetView) return;

    requestAnimationFrame(() => {
        targetView.style.display = 'block';
        // allow next frame to apply 'active' class which triggers CSS animation
        requestAnimationFrame(() => {
            targetView.classList.add('active');
            targetView.style.opacity = '';
        });
    });

    // Update respective views
    if (role === 'public') updatePublicView();
    if (role === 'committee') updateCommitteeView();
    if (role === 'student') updateStudentView();
    if (role === 'institutions') updateInstitutionsView();
    if (role === 'sponsors') updateSponsorsView();
    if (role === 'universities') updateUniversitiesView();
    if (role === 'gaming') updateGamingView();
}

// ===== Form Validation =====
function setupFormValidation() {
    const form = document.getElementById('grantForm');
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
}

function validateField(field) {
    // Required
    if (field.hasAttribute('required') && !field.value.trim()) {
        field.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        return false;
    }

    // Wallet address format
    if (field.id === 'walletAddress') {
        const walletRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!walletRegex.test(field.value)) {
            field.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            showToast('Invalid wallet address format', 'error');
            return false;
        }
    }

    // Grant amount limits
    if (field.id === 'grantAmount') {
        const amount = parseFloat(field.value);
        if (Number.isNaN(amount) || amount < 0.01 || amount > 5) {
            field.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            showToast('Amount must be between 0.01 and 5 ETH', 'error');
            return false;
        }
    }

    // Passed validation
    field.style.borderColor = 'rgba(16, 185, 129, 0.5)';
    return true;
}

// ===== Submit Grant =====
function submitGrant(e) {
    e.preventDefault();
    
    const form = e.target;
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) isValid = false;
    });
    
    if (!isValid) {
        showToast('Please fix the errors in the form', 'error');
        return;
    }
    
    const grant = {
        id: Date.now(),
        studentName: document.getElementById('studentName').value,
        institution: document.getElementById('institution').value,
        projectTitle: document.getElementById('projectTitle').value,
        projectDesc: document.getElementById('projectDesc').value,
        category: document.getElementById('projectCategory').value,
        amount: parseFloat(document.getElementById('grantAmount').value),
        duration: parseInt(document.getElementById('projectDuration').value),
        walletAddress: document.getElementById('walletAddress').value,
        status: 'pending_institution', // New status: pending institution review
        institutionDecision: null, // Institution's decision
        institutionComment: null, // Institution's comment
        committeeApproved: false, // Committee approval after institution decision
        votesApprove: 0,
        votesReject: 0,
        submittedBy: currentUser,
        submittedAt: new Date().toLocaleDateString(),
        votedBy: [],
        institutionReviewedAt: null,
        committeeReviewedAt: null
    };
    
    grants.push(grant);
    form.reset();
    document.getElementById('charCount').textContent = '0';
    
    inputs.forEach(input => input.style.borderColor = 'rgba(255, 255, 255, 0.15)');
    
    updateStudentView();
    showToast('Application submitted successfully! 🎉', 'success');
    
    setTimeout(() => {
        document.getElementById('myApplications').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
}

// ===== Update Student View =====
function updateStudentView() {
    let myGrants = grants.filter(g => g.submittedBy === currentUser);
    
    if (currentFilter !== 'all') {
        myGrants = myGrants.filter(g => g.status === currentFilter);
    }
    
    const container = document.getElementById('myApplications');
    
    if (myGrants.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>No ${currentFilter === 'all' ? '' : currentFilter} applications yet.</p>
                ${currentFilter !== 'all' ? '<p>Try changing the filter above.</p>' : '<p>Submit your first application using the form!</p>'}
            </div>
        `;
        return;
    }
    
    container.innerHTML = myGrants.map((grant, index) => `
        <div class="grant-card" style="animation-delay: ${index * 0.1}s">
            <div class="grant-header">
                <div>
                    <div class="grant-title">${grant.projectTitle}</div>
                    <div class="grant-info">📍 ${grant.institution}</div>
                </div>
                <span class="status-badge status-${grant.status}">${grant.status}</span>
            </div>
            <div class="grant-category">${getCategoryIcon(grant.category)} ${formatCategory(grant.category)}</div>
            <p class="grant-info" style="margin-top: 16px;">${grant.projectDesc.substring(0, 150)}${grant.projectDesc.length > 150 ? '...' : ''}</p>
            <div class="grant-amount">💰 ${grant.amount} ETH</div>
            <div class="grant-info">⏱️ ${grant.duration} months</div>
            <div class="grant-info">📅 ${grant.submittedAt}</div>
            ${grant.status === 'pending_institution' ? `
                <div style="margin-top: 16px; padding: 14px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; font-size: 0.9rem; color: #fbbf24;">
                    ⏳ На рассмотрении в учебном заведении: ${grant.institution}
                </div>
            ` : ''}
            ${grant.status === 'pending_committee' ? `
                <div style="margin-top: 16px; padding: 14px; background: rgba(99, 102, 241, 0.1); border-radius: 12px; font-size: 0.9rem; color: #6366f1;">
                    ⏳ На рассмотрении в комитете после решения учебного заведения
                </div>
            ` : ''}
            ${grant.status === 'approved' && grant.txHash ? `
                <div class="tx-hash">✅ TX: ${grant.txHash}</div>
            ` : ''}
            ${grant.status === 'rejected' ? `
                <div style="margin-top: 16px; padding: 14px; background: rgba(239, 68, 68, 0.1); border-radius: 12px; font-size: 0.9rem; color: #f87171;">
                    ❌ Not approved. You can submit a new application.
                </div>
            ` : ''}
        </div>
    `).join('');
}

// ===== Update Public View =====
function updatePublicView() {
    const approvedGrants = grants.filter(g => g.status === 'approved');
    const pendingGrants = grants.filter(g => g.status === 'pending');
    
    document.getElementById('totalGrants').textContent = grants.length;
    document.getElementById('approvedGrants').textContent = approvedGrants.length;
    document.getElementById('pendingGrants').textContent = pendingGrants.length;
    document.getElementById('totalFunding').textContent = 
        approvedGrants.reduce((sum, g) => sum + g.amount, 0).toFixed(2) + ' ETH';
    
    // Winners
    const winnersContainer = document.getElementById('winnersDisplay');
    if (approvedGrants.length === 0) {
        winnersContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏆</div>
                <p>No winners yet. Check back soon!</p>
            </div>
        `;
    } else {
        winnersContainer.innerHTML = approvedGrants.slice(-3).reverse().map((grant, index) => `
            <div class="winner-card" style="animation-delay: ${index * 0.15}s">
                <div class="winner-title">🎉 ${grant.projectTitle}</div>
                <div style="font-size: 1.15rem; margin: 12px 0; opacity: 0.95;">
                    👤 ${grant.studentName} - ${grant.institution}
                </div>
                <div class="grant-category" style="background: rgba(255,255,255,0.25); color: white; border-color: rgba(255,255,255,0.3);">
                    ${getCategoryIcon(grant.category)} ${formatCategory(grant.category)}
                </div>
                <p style="margin: 16px 0; opacity: 0.95; line-height: 1.6;">${grant.projectDesc.substring(0, 140)}...</p>
                <div style="font-size: 1.5rem; font-weight: 800; margin: 12px 0;">
                    💰 ${grant.amount} ETH
                </div>
                <div style="font-size: 0.95rem; opacity: 0.9;">⏱️ ${grant.duration} months</div>
                <div class="tx-hash">Transaction: ${grant.txHash || generateMockTxHash()}</div>
            </div>
        `).join('');
    }
    
    displayPublicGrants(grants);
}

function displayPublicGrants(grantsToDisplay) {
    const publicContainer = document.getElementById('publicGrantsDisplay');
    
    if (grantsToDisplay.length === 0) {
        publicContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p>No applications found</p>
            </div>
        `;
        return;
    }
    
    publicContainer.innerHTML = grantsToDisplay.map((grant, index) => `
        <div class="grant-card" style="animation-delay: ${index * 0.08}s">
            <div class="grant-header">
                <div>
                    <div class="grant-title">${grant.projectTitle}</div>
                    <div class="grant-info">👤 ${grant.studentName} - ${grant.institution}</div>
                </div>
                <span class="status-badge status-${grant.status}">${grant.status}</span>
            </div>
            <div class="grant-category">${getCategoryIcon(grant.category)} ${formatCategory(grant.category)}</div>
            <p class="grant-info" style="margin-top: 16px;">${grant.projectDesc}</p>
            <div class="grant-amount">💰 ${grant.amount} ETH</div>
            <div class="grant-info">⏱️ ${grant.duration} months</div>
            <div class="grant-info">📅 ${grant.submittedAt}</div>
            ${grant.status === 'approved' && grant.txHash ? 
                `<div class="tx-hash">✅ Funded: ${grant.txHash}</div>` : ''}
        </div>
    `).join('');
}

function filterPublicGrants(searchTerm) {
    const filtered = grants.filter(grant => {
        const search = searchTerm.toLowerCase();
        return grant.projectTitle.toLowerCase().includes(search) ||
               grant.studentName.toLowerCase().includes(search) ||
               grant.institution.toLowerCase().includes(search) ||
               grant.projectDesc.toLowerCase().includes(search);
    });
    
    displayPublicGrants(filtered);
}

// ===== Update Committee View =====
function updateCommitteeView() {
    // Комитет теперь видит только заявки, которые прошли через учебное заведение
    const pendingGrants = grants.filter(g => g.status === 'pending_committee');
    
    document.getElementById('committeePending').textContent = pendingGrants.length;
    document.getElementById('committeeVotes').textContent = committeeVotesToday;
    
    const container = document.getElementById('committeeGrantsDisplay');
    
    if (pendingGrants.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <p>Нет заявок для рассмотрения</p>
                <p>Все заявки от учебных заведений обработаны!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pendingGrants.map((grant, index) => `
        <div class="grant-card" style="animation-delay: ${index * 0.1}s">
            <div class="grant-header">
                <div>
                    <div class="grant-title">${grant.projectTitle}</div>
                    <div class="grant-info">👤 ${grant.studentName} - ${grant.institution}</div>
                </div>
                <span class="status-badge status-${grant.status}">От учебного заведения</span>
            </div>
            <div class="grant-category">${getCategoryIcon(grant.category)} ${formatCategory(grant.category)}</div>
            <p class="grant-info" style="margin-top: 16px;"><strong>Описание проекта:</strong><br>${grant.projectDesc}</p>
            
            ${grant.institutionDecision ? `
                <div style="margin-top: 16px; padding: 14px; background: ${grant.institutionDecision === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border-radius: 12px;">
                    <div style="font-weight: 600; margin-bottom: 8px; color: ${grant.institutionDecision === 'approved' ? '#22c55e' : '#ef4444'};">
                        ${grant.institutionDecision === 'approved' ? '✅ Учебное заведение одобрило' : '⚠️ Учебное заведение одобрило с замечаниями'}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                        <strong>Комментарий:</strong> ${grant.institutionComment || 'Без комментариев'}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                        📅 ${grant.institutionReviewedAt}
                    </div>
                </div>
            ` : ''}
            
            <div class="grant-amount">💰 ${grant.amount} ETH</div>
            <div class="grant-info">⏱️ ${grant.duration} месяцев</div>
            <div class="grant-info">📅 Подано: ${grant.submittedAt}</div>
            <div class="grant-info">🔐 <code>${grant.walletAddress.substring(0, 15)}...${grant.walletAddress.slice(-10)}</code></div>
            
            <div class="vote-section">
                <div class="vote-buttons">
                    <button class="vote-btn vote-approve" onclick="committeeVote(${grant.id}, 'approve')">
                        ✓ Одобрить
                    </button>
                    <button class="vote-btn vote-reject" onclick="committeeVote(${grant.id}, 'reject')">
                        ✗ Отклонить
                    </button>
                </div>
                <div class="votes-count">
                    <span>👍 ${grant.votesApprove} Одобрить</span>
                    <span>👎 ${grant.votesReject} Отклонить</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Institution Review =====
function institutionReview(grantId, decision, comment = '') {
    const grant = grants.find(g => g.id === grantId);
    if (!grant) return;
    
    if (grant.status !== 'pending_institution') {
        showToast('Эта заявка уже обработана', 'error');
        return;
    }
    
    grant.institutionDecision = decision;
    grant.institutionComment = comment || (decision === 'approved' ? 'Заявка соответствует требованиям' : 'Требуется доработка');
    grant.institutionReviewedAt = new Date().toLocaleDateString();
    
    // Отправляем заявку в комитет
    grant.status = 'pending_committee';
    
    showToast(`✅ Решение отправлено в комитет: ${decision === 'approved' ? 'Одобрено' : 'С замечаниями'}`, 'success');
    
    // Обновляем вид учебных заведений
    updateInstitutionsView();
    displayInstitutionApplications();
}

// ===== Committee Voting (финальное решение после учебного заведения) =====
function committeeVote(grantId, voteType) {
    const grant = grants.find(g => g.id === grantId);
    if (!grant) return;
    
    if (grant.status !== 'pending_committee') {
        showToast('Эта заявка ещё не прошла через учебное заведение', 'error');
        return;
    }
    
    const committeeId = 'committee1';
    if (grant.votedBy.includes(committeeId)) {
        showToast('Вы уже проголосовали за эту заявку', 'error');
        return;
    }
    
    grant.votedBy.push(committeeId);
    committeeVotesToday++;
    
    if (voteType === 'approve') {
        grant.votesApprove++;
        showToast('Голос записан: Одобрено ✓', 'success');
        
        if (grant.votesApprove >= 3) {
            grant.status = 'approved';
            grant.txHash = generateMockTxHash();
            grant.committeeReviewedAt = new Date().toLocaleDateString();
            showToast(`🎉 Заявка ОДОБРЕНА! Транзакция выполнена через блокчейн.`, 'success');
        }
    } else {
        grant.votesReject++;
        showToast('Голос записан: Отклонено ✗', 'info');
        
        if (grant.votesReject >= 3) {
            grant.status = 'rejected';
            grant.committeeReviewedAt = new Date().toLocaleDateString();
            showToast('Заявка отклонена комитетом', 'error');
        }
    }
    
    updateCommitteeView();
    updateStudentView();
}

// Старая функция vote для обратной совместимости (теперь вызывает committeeVote)
function vote(grantId, voteType) {
    committeeVote(grantId, voteType);
}

// ===== Update Institutions View =====
function updateInstitutionsView() {
    // Показываем секцию заявок для учебных заведений если пользователь - institution
    const applicationsSection = document.getElementById('institutionApplicationsSection');
    if (applicationsSection) {
        if (userStatus === 'institution') {
            applicationsSection.style.display = 'block';
            displayInstitutionApplications();
        } else {
            applicationsSection.style.display = 'none';
        }
    }
    
    const container = document.getElementById('institutionsDisplay');
    
    if (institutionsView === 'list') {
        container.className = 'institutions-list';
    } else {
        container.className = 'institutions-grid';
    }
    
    container.innerHTML = institutions.map((inst, index) => `
        <div class="institution-card" style="animation-delay: ${index * 0.1}s">
            <div class="inst-logo" style="background: ${inst.color}">
                ${inst.icon}
            </div>
            <div class="inst-name">${inst.name}</div>
            <div class="inst-location">📍 ${inst.location}</div>
            <p class="grant-info">${inst.description}</p>
            <div class="inst-stats">
                <div class="inst-stat-item">
                    <div class="inst-stat-value">${inst.students}</div>
                    <div class="inst-stat-label">Students</div>
                </div>
                <div class="inst-stat-item">
                    <div class="inst-stat-value">${inst.grants}</div>
                    <div class="inst-stat-label">Grants</div>
                </div>
                <div class="inst-stat-item">
                    <div class="inst-stat-value">${inst.funding}</div>
                    <div class="inst-stat-label">ETH</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Display Institution Applications =====
function displayInstitutionApplications() {
    const container = document.getElementById('institutionApplicationsDisplay');
    if (!container) return;
    
    // Учебные заведения видят только заявки со статусом pending_institution
    const pendingApplications = grants.filter(g => g.status === 'pending_institution');
    
    if (pendingApplications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <p>Нет заявок для рассмотрения</p>
                <p>Все заявки студентов обработаны!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pendingApplications.map((grant, index) => `
        <div class="grant-card" style="animation-delay: ${index * 0.1}s">
            <div class="grant-header">
                <div>
                    <div class="grant-title">${grant.projectTitle}</div>
                    <div class="grant-info">👤 ${grant.studentName}</div>
                </div>
                <span class="status-badge status-pending_institution">На рассмотрении</span>
            </div>
            <div class="grant-category">${getCategoryIcon(grant.category)} ${formatCategory(grant.category)}</div>
            <p class="grant-info" style="margin-top: 16px;"><strong>Описание проекта:</strong><br>${grant.projectDesc}</p>
            <div class="grant-amount">💰 ${grant.amount} ETH</div>
            <div class="grant-info">⏱️ ${grant.duration} месяцев</div>
            <div class="grant-info">📅 Подано: ${grant.submittedAt}</div>
            <div class="grant-info">🔐 <code>${grant.walletAddress.substring(0, 15)}...${grant.walletAddress.slice(-10)}</code></div>
            
            <div style="margin-top: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-primary);">
                    Комментарий для комитета:
                </label>
                <textarea 
                    id="comment-${grant.id}" 
                    placeholder="Добавьте ваш комментарий (опционально)"
                    style="width: 100%; min-height: 80px; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; color: var(--text-primary); font-family: inherit; resize: vertical;"
                ></textarea>
            </div>
            
            <div class="vote-section" style="margin-top: 16px;">
                <div class="vote-buttons">
                    <button class="vote-btn vote-approve" onclick="institutionApprove(${grant.id})">
                        ✓ Одобрить и отправить в комитет
                    </button>
                    <button class="vote-btn vote-reject" onclick="institutionApproveWithComments(${grant.id})">
                        ⚠️ Одобрить с замечаниями
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Institution Actions =====
function institutionApprove(grantId) {
    const commentField = document.getElementById(`comment-${grantId}`);
    const comment = commentField ? commentField.value : '';
    institutionReview(grantId, 'approved', comment);
}

function institutionApproveWithComments(grantId) {
    const commentField = document.getElementById(`comment-${grantId}`);
    const comment = commentField ? commentField.value : 'Требуется учесть замечания';
    
    if (!comment.trim()) {
        showToast('Пожалуйста, добавьте комментарий с замечаниями', 'error');
        return;
    }
    
    institutionReview(grantId, 'approved_with_comments', comment);
}

// ===== Connect Wallet =====
function connectWallet() {
    const statusEl = document.getElementById('walletStatus');
    const statusDot = statusEl.querySelector('.status-dot');
    const btnWallet = document.querySelector('.btn-wallet');
    
    if (walletConnected) {
        walletConnected = false;
        statusEl.innerHTML = '<span class="status-dot"></span> Not Connected';
        btnWallet.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="7" width="18" height="13" rx="2"/>
                <path d="M3 11h18"/>
                <circle cx="7" cy="15" r="1"/>
            </svg>
            Connect
        `;
        showToast('Wallet disconnected', 'info');
    } else {
        showToast('Connecting to wallet...', 'info');
        
        setTimeout(() => {
            walletConnected = true;
            const mockAddress = '0x' + Array.from({length: 40}, () => 
                Math.floor(Math.random() * 16).toString(16)).join('');
            
            statusEl.innerHTML = `
                <span class="status-dot connected"></span> 
                ${mockAddress.substring(0, 6)}...${mockAddress.slice(-4)}
            `;
            
            btnWallet.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Connected
            `;
            
            document.getElementById('walletAddress').value = mockAddress;
            showToast('Wallet connected successfully! 🎉', 'success');
        }, 1500);
    }
}

// ===== Toast Notification =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ===== Registration Dropdown Menu =====
function toggleRegistrationMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('registrationMenu');
    menu.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('registrationMenu');
    const dropdown = document.querySelector('.registration-dropdown');
    
    if (menu && dropdown && !dropdown.contains(event.target)) {
        menu.classList.remove('show');
    }
});

// ===== Utility Functions =====
function getCategoryIcon(category) {
    const icons = {
        technology: '💻',
        research: '🔬',
        community: '🤝',
        arts: '🎨',
        environment: '🌱'
    };
    return icons[category] || '📚';
}

function formatCategory(category) {
    return category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function generateMockTxHash() {
    return '0x' + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('');
}

// ===== Load Sample Data =====
function loadSampleData() {
    grants = [
        {
            id: 1,
            studentName: 'Alice Johnson',
            institution: 'Tech University',
            projectTitle: 'AI Learning Platform for Rural Education',
            projectDesc: 'Building an accessible AI-powered learning platform that brings quality education to students in rural and underserved areas using machine learning.',
            category: 'technology',
            amount: 1.5,
            duration: 6,
            walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            status: 'approved',
            votesApprove: 5,
            votesReject: 0,
            submittedBy: 'alice123',
            submittedAt: '10/20/2025',
            txHash: '0x8f3e7b9a2c5d1f6e4a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
            votedBy: ['c1', 'c2', 'c3', 'c4', 'c5']
        },
        {
            id: 2,
            studentName: 'Bob Martinez',
            institution: 'Green Valley College',
            projectTitle: 'Community Solar Energy Initiative',
            projectDesc: 'Installing solar panels in community centers to provide free electricity and teach renewable energy principles to local students.',
            category: 'environment',
            amount: 2.0,
            duration: 8,
            walletAddress: '0x9a3f8c2e1d5b7a4f6c8e9d1a2b3c4d5e6f7a8b9c',
            status: 'pending_institution',
            institutionDecision: null,
            institutionComment: null,
            committeeApproved: false,
            votesApprove: 0,
            votesReject: 0,
            submittedBy: 'bob456',
            submittedAt: '10/23/2025',
            votedBy: [],
            institutionReviewedAt: null,
            committeeReviewedAt: null
        },
        {
            id: 3,
            studentName: 'Chen Wei',
            institution: 'Metropolitan Arts Academy',
            projectTitle: 'Digital Art Therapy Program',
            projectDesc: 'Creating a digital art therapy program for students dealing with stress and anxiety, combining traditional techniques with modern tools.',
            category: 'arts',
            amount: 0.8,
            duration: 4,
            walletAddress: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
            status: 'pending_committee',
            institutionDecision: 'approved',
            institutionComment: 'Отличный проект! Соответствует всем требованиям.',
            committeeApproved: false,
            votesApprove: 1,
            votesReject: 0,
            submittedBy: 'chen789',
            submittedAt: '10/24/2025',
            votedBy: ['c1', 'c2']
        },
        {
            id: 4,
            studentName: 'Diana Singh',
            institution: 'Research Institute of Science',
            projectTitle: 'Climate Change Data Analysis Tool',
            projectDesc: 'Developing an open-source tool for analyzing climate data to help researchers and students understand environmental changes.',
            category: 'research',
            amount: 1.2,
            duration: 5,
            walletAddress: '0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
            status: 'approved',
            votesApprove: 4,
            votesReject: 0,
            submittedBy: 'diana321',
            submittedAt: '10/18/2025',
            txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
            votedBy: ['c1', 'c2', 'c3', 'c4']
        }
    ];
    
    institutions = [
        {
            id: 1,
            name: 'Tech University',
            location: 'San Francisco, USA',
            icon: '🎓',
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            description: 'Leading institution in technology and innovation education',
            students: 45,
            grants: 12,
            funding: '18.5'
        },
        {
            id: 2,
            name: 'Green Valley College',
            location: 'Portland, USA',
            icon: '🌳',
            color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            description: 'Focused on environmental studies and sustainable development',
            students: 32,
            grants: 8,
            funding: '12.3'
        },
        {
            id: 3,
            name: 'Metropolitan Arts Academy',
            location: 'New York, USA',
            icon: '🎨',
            color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            description: 'Premier arts institution fostering creative excellence',
            students: 28,
            grants: 7,
            funding: '9.8'
        },
        {
            id: 4,
            name: 'Research Institute of Science',
            location: 'Boston, USA',
            icon: '🔬',
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            description: 'Advanced research in sciences and technology',
            students: 56,
            grants: 15,
            funding: '24.7'
        },
        {
            id: 5,
            name: 'Global Business School',
            location: 'London, UK',
            icon: '💼',
            color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            description: 'International business and entrepreneurship education',
            students: 41,
            grants: 10,
            funding: '15.2'
        },
        {
            id: 6,
            name: 'Community College Central',
            location: 'Chicago, USA',
            icon: '🤝',
            color: 'linear-gradient(135deg, #ff9a56 0%, #ffcd1f 100%)',
            description: 'Community-focused education and local development',
            students: 67,
            grants: 19,
            funding: '28.9'
        },
        {
            id: 7,
            name: 'Digital Innovation Hub',
            location: 'Berlin, Germany',
            icon: '💻',
            color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            description: 'Cutting-edge digital technology and AI research',
            students: 38,
            grants: 11,
            funding: '16.4'
        },
        {
            id: 8,
            name: 'Medical Sciences University',
            location: 'Toronto, Canada',
            icon: '⚕️',
            color: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            description: 'Healthcare education and medical research',
            students: 52,
            grants: 14,
            funding: '21.6'
        }
    ];
    
    updateStudentView();
    updateInstitutionsView();
    updateSponsorsView();
    updateUniversitiesView();
}

// Handle window resize for tab indicator
window.addEventListener('resize', updateTabIndicator);

// ===== User Status Management =====
function updateUserStatus() {
    const statusBlock = document.querySelector('.user-status-block');
    const statusIcon = document.getElementById('userStatusIcon');
    const statusValue = document.getElementById('userStatus');
    
    // Remove all status classes
    statusBlock.classList.remove('public', 'student', 'committee', 'institution');
    
    switch (userStatus) {
        case 'student':
            statusIcon.textContent = '👨‍🎓';
            statusValue.textContent = 'Студент';
            statusBlock.classList.add('student');
            break;
        case 'committee':
            statusIcon.textContent = '⚖️';
            statusValue.textContent = 'Комитет';
            statusBlock.classList.add('committee');
            break;
        case 'institution':
            statusIcon.textContent = '🏛️';
            statusValue.textContent = 'Учебное заведение';
            statusBlock.classList.add('institution');
            break;
        default:
            statusIcon.textContent = '🌍';
            statusValue.textContent = 'Пользователь мира';
            statusBlock.classList.add('public');
    }
}

function setUserStatus(status) {
    userStatus = status;
    updateUserStatus();
    applyAccessRestrictions();
    updateDemoButtons();
    
    // Show appropriate view based on status
    if (status === 'student') {
        switchRole('student', 0);
    } else if (status === 'committee') {
        switchRole('committee', 2);
    } else if (status === 'institution') {
        switchRole('institutions', 3);
    } else {
        switchRole('public', 1);
    }
}

function updateDemoButtons() {
    const demoButtons = document.querySelectorAll('.demo-btn');
    demoButtons.forEach(btn => {
        btn.classList.remove('active');
        const status = btn.getAttribute('onclick').match(/setUserStatus\('(\w+)'\)/)?.[1];
        if (status === userStatus) {
            btn.classList.add('active');
        }
    });
}

function applyAccessRestrictions() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const registrationLinks = document.querySelector('.registration-links');
    
    // Hide/show navigation tabs based on user status
    navTabs.forEach(tab => {
        const role = tab.getAttribute('data-role');
        const isVisible = canAccessRole(role);
        tab.style.display = isVisible ? 'flex' : 'none';
    });
    
    // Ссылки регистрации всегда видны (любой может зарегистрироваться с новой роли)
    if (registrationLinks) {
        registrationLinks.style.display = 'flex';
    }
    
    // Apply form restrictions
    applyFormRestrictions();
}

function canAccessRole(role) {
    switch (userStatus) {
        case 'public':
            return role === 'public' || role === 'sponsors' || role === 'universities' || role === 'gaming';
        case 'student':
            return role === 'student' || role === 'public' || role === 'sponsors' || role === 'universities' || role === 'gaming';
        case 'committee':
            return true; // Committee has access to everything
        case 'institution':
            return role === 'institutions' || role === 'public' || role === 'sponsors' || role === 'universities' || role === 'gaming';
        default:
            return role === 'public';
    }
}

function applyFormRestrictions() {
    const grantForm = document.getElementById('grantForm');
    const managementActions = document.querySelector('.management-actions');
    
    // Grant form restrictions
    if (grantForm) {
        if (userStatus === 'student') {
            grantForm.style.display = 'block';
        } else {
            grantForm.style.display = 'none';
        }
    }
    
    // Management actions restrictions
    if (managementActions) {
        if (userStatus === 'committee') {
            managementActions.style.display = 'block';
        } else {
            managementActions.style.display = 'none';
        }
    }
    
    // Add status-specific messages
    addStatusMessages();
}

function addStatusMessages() {
    // Remove existing status messages
    const existingMessages = document.querySelectorAll('.status-message');
    existingMessages.forEach(msg => msg.remove());
    
    const studentView = document.getElementById('student-view');
    const publicView = document.getElementById('public-view');
    
    if (userStatus === 'public' && studentView) {
        const message = document.createElement('div');
        message.className = 'status-message glass-effect';
        message.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px; background: rgba(107, 114, 128, 0.1); border: 1px solid rgba(107, 114, 128, 0.2);">
                <div style="font-size: 1.5rem;">🌍</div>
                <div>
                    <div style="font-weight: 600; color: var(--text-primary);">Пользователь мира</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">Вы можете просматривать информацию, но для подачи заявок необходимо зарегистрироваться как студент.</div>
                </div>
            </div>
        `;
        studentView.insertBefore(message, studentView.firstChild);
    }
    
    if (userStatus === 'student' && studentView) {
        const message = document.createElement('div');
        message.className = 'status-message glass-effect';
        message.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2);">
                <div style="font-size: 1.5rem;">👨‍🎓</div>
                <div>
                    <div style="font-weight: 600; color: #10b981;">Студент</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">Добро пожаловать! Вы можете подавать заявки на гранты и просматривать требования университетов.</div>
                </div>
            </div>
        `;
        studentView.insertBefore(message, studentView.firstChild);
    }
    
    if (userStatus === 'committee' && publicView) {
        const message = document.createElement('div');
        message.className = 'status-message glass-effect';
        message.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2);">
                <div style="font-size: 1.5rem;">⚖️</div>
                <div>
                    <div style="font-weight: 600; color: #6366f1;">Комитет</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">У вас есть полный доступ ко всем функциям системы для управления заявками.</div>
                </div>
            </div>
        `;
        publicView.insertBefore(message, publicView.firstChild);
    }
    
    if (userStatus === 'institution' && publicView) {
        const message = document.createElement('div');
        message.className = 'status-message glass-effect';
        message.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2);">
                <div style="font-size: 1.5rem;">🏛️</div>
                <div>
                    <div style="font-weight: 600; color: #f59e0b;">Учебное заведение</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">Вы можете управлять информацией о своем заведении и обрабатывать заявки студентов.</div>
                </div>
            </div>
        `;
        publicView.insertBefore(message, publicView.firstChild);
    }
}

// ===== Registration Status Updates =====
function onStudentRegistration() {
    setUserStatus('student');
    showToast('Добро пожаловать! Теперь вы можете подавать заявки на гранты.', 'success');
}

function onCommitteeRegistration() {
    setUserStatus('committee');
    showToast('Добро пожаловать в комитет! Теперь вы можете рассматривать заявки.', 'success');
}

function onInstitutionRegistration() {
    setUserStatus('institution');
    showToast('Добро пожаловать! Ваше учебное заведение зарегистрировано.', 'success');
}

function resetUserStatus() {
    localStorage.removeItem('userStatus');
    localStorage.removeItem('userData');
    setUserStatus('public');
    showToast('Статус сброшен. Вы снова пользователь мира.', 'info');
}

// ===== Currency Conversion =====
async function updateCurrencyRates() {
    try {
        // In a real app, this would fetch from a crypto API
        // For demo purposes, we'll use a mock rate
        ethToUsdRate = 2500 + Math.random() * 500; // Simulate price fluctuation
        updateCurrencyDisplays();
    } catch (error) {
        console.error('Failed to update currency rates:', error);
    }
}

function updateCurrencyDisplays() {
    // Update all ETH amounts to show USD equivalent
    document.querySelectorAll('.grant-amount').forEach(element => {
        const ethAmount = parseFloat(element.textContent.match(/[\d.]+/)?.[0] || '0');
        const usdAmount = (ethAmount * ethToUsdRate).toFixed(2);
        element.innerHTML = `💰 ${ethAmount} ETH <span class="usd-amount">($${usdAmount})</span>`;
    });
    
    // Update total funding display
    const totalFundingElement = document.getElementById('totalFunding');
    if (totalFundingElement) {
        const ethAmount = parseFloat(totalFundingElement.textContent.match(/[\d.]+/)?.[0] || '0');
        const usdAmount = (ethAmount * ethToUsdRate).toFixed(2);
        totalFundingElement.innerHTML = `${ethAmount.toFixed(2)} ETH <span class="usd-amount">($${usdAmount})</span>`;
    }
}

// ===== Sponsors Management =====
function loadSponsors() {
    sponsors = [
        {
            id: 1,
            name: 'EduTech Foundation',
            logo: '🎓',
            description: 'Supporting educational technology initiatives',
            totalDonated: 150.5,
            activeGrants: 12,
            website: 'https://edutechfoundation.org'
        },
        {
            id: 2,
            name: 'Blockchain Education Fund',
            logo: '⛓️',
            description: 'Promoting blockchain education worldwide',
            totalDonated: 89.2,
            activeGrants: 8,
            website: 'https://blockchainedu.org'
        },
        {
            id: 3,
            name: 'Global Learning Initiative',
            logo: '🌍',
            description: 'Making education accessible globally',
            totalDonated: 234.7,
            activeGrants: 18,
            website: 'https://globallearning.org'
        },
        {
            id: 4,
            name: 'Innovation Capital',
            logo: '💡',
            description: 'Investing in educational innovation',
            totalDonated: 67.8,
            activeGrants: 6,
            website: 'https://innovationcapital.edu'
        },
        {
            id: 5,
            name: 'Future Scholars Fund',
            logo: '🔬',
            description: 'Supporting research and development',
            totalDonated: 198.3,
            activeGrants: 15,
            website: 'https://futurescholars.org'
        }
    ];
}

function displaySponsors() {
    const container = document.getElementById('sponsorsDisplay');
    if (!container) return;
    
    if (sponsors.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🤝</div>
                <p>No sponsors available at the moment</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sponsors.map((sponsor, index) => `
        <div class="sponsor-card" style="animation-delay: ${index * 0.1}s">
            <div class="sponsor-logo">${sponsor.logo}</div>
            <div class="sponsor-name">${sponsor.name}</div>
            <div class="sponsor-description">${sponsor.description}</div>
            <div class="sponsor-stats">
                <div class="sponsor-stat">
                    <div class="stat-value">${sponsor.totalDonated} ETH</div>
                    <div class="stat-label">Total Donated</div>
                </div>
                <div class="sponsor-stat">
                    <div class="stat-value">${sponsor.activeGrants}</div>
                    <div class="stat-label">Active Grants</div>
                </div>
            </div>
            <div class="sponsor-actions">
                <a href="${sponsor.website}" target="_blank" class="btn btn-ghost sponsor-link">
                    Visit Website
                </a>
            </div>
        </div>
    `).join('');
}

// ===== University Requirements =====
function loadUniversityRequirements() {
    const universities = [
        {
            name: 'Harvard University',
            country: 'USA',
            requirements: {
                gpa: '3.7+',
                toefl: '100+',
                ielts: '7.0+',
                gre: '320+',
                recommendations: '3 letters',
                essays: '2-3 essays'
            },
            ranking: 1,
            acceptanceRate: '3.4%'
        },
        {
            name: 'Stanford University',
            country: 'USA',
            requirements: {
                gpa: '3.8+',
                toefl: '100+',
                ielts: '7.0+',
                gre: '325+',
                recommendations: '3 letters',
                essays: '2 essays'
            },
            ranking: 2,
            acceptanceRate: '4.3%'
        },
        {
            name: 'University of Oxford',
            country: 'UK',
            requirements: {
                gpa: '3.7+',
                toefl: '110+',
                ielts: '7.5+',
                gre: 'Not required',
                recommendations: '2 letters',
                essays: 'Personal statement'
            },
            ranking: 3,
            acceptanceRate: '17.5%'
        },
        {
            name: 'MIT',
            country: 'USA',
            requirements: {
                gpa: '3.8+',
                toefl: '100+',
                ielts: '7.0+',
                gre: '330+',
                recommendations: '3 letters',
                essays: '2 essays'
            },
            ranking: 4,
            acceptanceRate: '6.7%'
        },
        {
            name: 'University of Cambridge',
            country: 'UK',
            requirements: {
                gpa: '3.7+',
                toefl: '110+',
                ielts: '7.5+',
                gre: 'Not required',
                recommendations: '2 letters',
                essays: 'Personal statement'
            },
            ranking: 5,
            acceptanceRate: '21%'
        }
    ];
    
    return universities;
}

function displayUniversityRequirements() {
    const universities = loadUniversityRequirements();
    const container = document.getElementById('universitiesDisplay');
    if (!container) return;
    
    container.innerHTML = universities.map((uni, index) => `
        <div class="university-card" style="animation-delay: ${index * 0.1}s">
            <div class="university-header">
                <div class="university-name">${uni.name}</div>
                <div class="university-country">${uni.country}</div>
                <div class="university-ranking">#${uni.ranking} Global</div>
            </div>
            <div class="university-requirements">
                <div class="requirement-item">
                    <span class="requirement-label">GPA:</span>
                    <span class="requirement-value">${uni.requirements.gpa}</span>
                </div>
                <div class="requirement-item">
                    <span class="requirement-label">TOEFL:</span>
                    <span class="requirement-value">${uni.requirements.toefl}</span>
                </div>
                <div class="requirement-item">
                    <span class="requirement-label">IELTS:</span>
                    <span class="requirement-value">${uni.requirements.ielts}</span>
                </div>
                <div class="requirement-item">
                    <span class="requirement-label">GRE:</span>
                    <span class="requirement-value">${uni.requirements.gre}</span>
                </div>
                <div class="requirement-item">
                    <span class="requirement-label">Recommendations:</span>
                    <span class="requirement-value">${uni.requirements.recommendations}</span>
                </div>
                <div class="requirement-item">
                    <span class="requirement-label">Essays:</span>
                    <span class="requirement-value">${uni.requirements.essays}</span>
                </div>
            </div>
            <div class="university-stats">
                <div class="acceptance-rate">Acceptance Rate: ${uni.acceptanceRate}</div>
            </div>
        </div>
    `).join('');
}

function updateSponsorsView() {
    displaySponsors();
    updateSponsorStats();
}

function updateUniversitiesView() {
    displayUniversityRequirements();
}

function updateSponsorStats() {
    const totalFunding = sponsors.reduce((sum, s) => sum + s.totalDonated, 0);
    const activeSponsors = sponsors.length;
    const totalGrants = sponsors.reduce((sum, s) => sum + s.activeGrants, 0);
    
    const fundingEl = document.getElementById('totalSponsorFunding');
    const sponsorsEl = document.getElementById('activeSponsors');
    const grantsEl = document.getElementById('sponsorGrants');
    
    if (fundingEl) fundingEl.textContent = totalFunding.toFixed(1);
    if (sponsorsEl) sponsorsEl.textContent = activeSponsors;
    if (grantsEl) grantsEl.textContent = totalGrants;
}

// ===== Gaming Rewards =====
function loadAchievements() {
    achievements = [
        {
            id: 1,
            title: "Отличник",
            description: "Получить только пятерки за семестр",
            icon: "⭐",
            category: "academic",
            rarity: "rare",
            points: 100,
            rewards: ["Steam обои", "100 Steam Points"],
            progress: 0,
            maxProgress: 1,
            unlocked: false
        },
        {
            id: 2,
            title: "Идеальная посещаемость",
            description: "Ни одного пропущенного учебного дня",
            icon: "📅",
            category: "attendance",
            rarity: "epic",
            points: 150,
            rewards: ["NFT Badge", "Игровая валюта 500₽"],
            progress: 0,
            maxProgress: 1,
            unlocked: false
        },
        {
            id: 3,
            title: "Все экзамены на отлично",
            description: "Сдать все экзамены на высший балл",
            icon: "🏆",
            category: "academic",
            rarity: "legendary",
            points: 300,
            rewards: ["Платная игра Steam", "NFT сертификат", "1000 Steam Points"],
            progress: 0,
            maxProgress: 1,
            unlocked: false
        },
        {
            id: 4,
            title: "Лучшее портфолио",
            description: "Создать выдающееся портфолио проектов",
            icon: "💼",
            category: "projects",
            rarity: "epic",
            points: 200,
            rewards: ["Эксклюзивные стикеры", "Premium игра"],
            progress: 0,
            maxProgress: 5,
            unlocked: false
        },
        {
            id: 5,
            title: "Победа в олимпиаде",
            description: "Занять призовое место в международной олимпиаде",
            icon: "🥇",
            category: "competitions",
            rarity: "legendary",
            points: 500,
            rewards: ["Эксклюзивная игра", "NFT трофей", "Telegram Premium"],
            progress: 0,
            maxProgress: 1,
            unlocked: false
        },
        {
            id: 6,
            title: "100% домашних заданий",
            description: "Выполнить все домашние задания в течение года",
            icon: "📚",
            category: "academic",
            rarity: "rare",
            points: 120,
            rewards: ["Игровые предметы", "200 Steam Points"],
            progress: 0,
            maxProgress: 1,
            unlocked: false
        },
        {
            id: 7,
            title: "Защита научной работы",
            description: "Успешно защитить научный проект",
            icon: "🔬",
            category: "projects",
            rarity: "epic",
            points: 250,
            rewards: ["NFT Сертификат", "Премиум игра", "Бонусы"],
            progress: 0,
            maxProgress: 1,
            unlocked: false
        },
        {
            id: 8,
            title: "Звезда олимпиад",
            description: "Участвовать в 5 олимпиадах",
            icon: "⭐",
            category: "competitions",
            rarity: "rare",
            points: 150,
            rewards: ["Коллекция стикеров", "Игровые бонусы"],
            progress: 0,
            maxProgress: 5,
            unlocked: false
        }
    ];
}

function loadRewards() {
    rewards = [
        {
            id: 1,
            title: "Steam Обои",
            description: "Уникальные обои для профиля Steam",
            icon: "🖼️",
            platform: "steam",
            value: "50 Steam Points"
        },
        {
            id: 2,
            title: "Платная игра",
            description: "Любая игра из Steam стоимостью до 1500₽",
            icon: "🎮",
            platform: "games",
            value: "До 1500₽"
        },
        {
            id: 3,
            title: "NFT Badge",
            description: "Эксклюзивный NFT значок достижений",
            icon: "🎖️",
            platform: "nft",
            value: "Уникальный"
        },
        {
            id: 4,
            title: "Telegram Premium",
            description: "Подписка на Telegram Premium",
            icon: "⭐",
            platform: "telegram",
            value: "3 месяца"
        },
        {
            id: 5,
            title: "Игровая валюта",
            description: "Внутриигровая валюта для популярных игр",
            icon: "💰",
            platform: "games",
            value: "500-1000₽"
        },
        {
            id: 6,
            title: "NFT Сертификат",
            description: "Цифровой сертификат достижений",
            icon: "📜",
            platform: "nft",
            value: "Эксклюзив"
        },
        {
            id: 7,
            title: "Стикеры",
            description: "Эксклюзивные стикеры для Telegram",
            icon: "🎨",
            platform: "telegram",
            value: "Набор"
        },
        {
            id: 8,
            title: "Steam Points",
            description: "Очки для магазина Steam",
            icon: "💎",
            platform: "steam",
            value: "100-1000"
        }
    ];
}

function updateGamingView() {
    updateUserProgress();
    displayAchievements('academic');
    displayRewards('all');
    displayLeaderboard();
    setupGamingEventListeners();
}

function setupGamingEventListeners() {
    // Category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            categoryTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const category = this.getAttribute('data-category');
            displayAchievements(category);
        });
    });
    
    // Reward filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const platform = this.getAttribute('data-platform');
            displayRewards(platform);
        });
    });
}

function updateUserProgress() {
    const unlockedAchievements = achievements.filter(a => a.unlocked).length;
    const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
    
    userProgress.achievements = unlockedAchievements;
    userProgress.points = totalPoints;
    userProgress.level = Math.floor(totalPoints / 100) + 1;
    
    document.getElementById('userAchievements').textContent = userProgress.achievements;
    document.getElementById('userRewards').textContent = userProgress.rewards;
    document.getElementById('userPoints').textContent = userProgress.points;
    
    const progressPercent = (userProgress.points % 100);
    document.getElementById('progressFill').style.width = progressPercent + '%';
    document.getElementById('nextLevelProgress').textContent = (100 - progressPercent);
}

function displayAchievements(category) {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    
    const filteredAchievements = achievements.filter(a => a.category === category);
    
    if (filteredAchievements.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <p>Нет достижений в этой категории</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredAchievements.map(achievement => `
        <div class="achievement-card ${achievement.unlocked ? 'unlocked' : ''}">
            <div class="achievement-header">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h4>${achievement.title}</h4>
                    <span class="achievement-rarity rarity-${achievement.rarity}">${getRarityName(achievement.rarity)}</span>
                </div>
            </div>
            <p class="achievement-description">${achievement.description}</p>
            <div class="achievement-rewards">
                ${achievement.rewards.map(reward => `
                    <div class="reward-item">🎁 ${reward}</div>
                `).join('')}
            </div>
            <div class="achievement-progress">
                <div class="progress-info">
                    <span>Прогресс</span>
                    <span>${achievement.progress}/${achievement.maxProgress}</span>
                </div>
                <div class="achievement-progress-bar">
                    <div class="achievement-progress-fill" style="width: ${(achievement.progress / achievement.maxProgress) * 100}%"></div>
                </div>
            </div>
            <div class="achievement-actions">
                <button class="claim-btn" ${!achievement.unlocked ? 'disabled' : ''}>
                    ${achievement.unlocked ? '✅ Получить награду' : '🔒 Заблокировано'}
                </button>
            </div>
        </div>
    `).join('');
}

function displayRewards(platform) {
    const grid = document.getElementById('rewardsGrid');
    if (!grid) return;
    
    const filteredRewards = platform === 'all' 
        ? rewards 
        : rewards.filter(r => r.platform === platform);
    
    if (filteredRewards.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎁</div>
                <p>Нет наград для этой платформы</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredRewards.map((reward, index) => `
        <div class="reward-card" style="animation-delay: ${index * 0.1}s">
            <div class="reward-header">
                <div class="reward-icon">${reward.icon}</div>
                <span class="reward-platform">${getPlatformName(reward.platform)}</span>
            </div>
            <div class="reward-info">
                <h4>${reward.title}</h4>
                <p class="reward-description">${reward.description}</p>
            </div>
            <div class="reward-value">
                <span>💎 ${reward.value}</span>
            </div>
        </div>
    `).join('');
}

function displayLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    if (!leaderboard) return;
    
    const leaders = [
        { name: 'Иван Петров', avatar: '👨‍🎓', points: 1250, achievements: 15 },
        { name: 'Мария Смирнова', avatar: '👩‍🎓', points: 1180, achievements: 14 },
        { name: 'Алексей Иванов', avatar: '👨‍💼', points: 1050, achievements: 12 },
        { name: 'Екатерина Волкова', avatar: '👩‍💻', points: 980, achievements: 11 },
        { name: 'Дмитрий Козлов', avatar: '👨‍🔬', points: 870, achievements: 10 }
    ];
    
    leaderboard.innerHTML = leaders.map((leader, index) => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank ${index < 3 ? 'top-3' : ''}">${index + 1}</div>
            <div class="leaderboard-user">
                <div class="leaderboard-avatar">${leader.avatar}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${leader.name}</div>
                    <div class="leaderboard-achievements">${leader.achievements} достижений</div>
                </div>
            </div>
            <div class="leaderboard-points">${leader.points} очков</div>
        </div>
    `).join('');
}

function getRarityName(rarity) {
    const names = {
        common: 'Обычное',
        rare: 'Редкое',
        epic: 'Эпическое',
        legendary: 'Легендарное'
    };
    return names[rarity] || rarity;
}

function getPlatformName(platform) {
    const names = {
        steam: 'Steam',
        nft: 'NFT',
        telegram: 'Telegram',
        games: 'Игры',
        all: 'Все'
    };
    return names[platform] || platform;
}