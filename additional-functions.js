// ===== Update Sponsors View =====
function updateSponsorsView() {
    const totalFunding = sponsors.reduce((sum, sponsor) => sum + sponsor.totalDonated, 0);
    const activeSponsors = sponsors.length;
    const totalGrants = sponsors.reduce((sum, sponsor) => sum + sponsor.activeGrants, 0);
    
    document.getElementById('totalSponsorFunding').textContent = totalFunding.toFixed(1);
    document.getElementById('activeSponsors').textContent = activeSponsors;
    document.getElementById('sponsorGrants').textContent = totalGrants;
    
    displaySponsors();
}

// ===== Update Universities View =====
function updateUniversitiesView() {
    displayUniversityRequirements();
    
    // Setup search functionality
    const searchInput = document.getElementById('searchUniversities');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterUniversities(this.value);
        });
    }
}

function filterUniversities(searchTerm) {
    const universities = loadUniversityRequirements();
    const filtered = universities.filter(uni => {
        const search = searchTerm.toLowerCase();
        return uni.name.toLowerCase().includes(search) ||
               uni.country.toLowerCase().includes(search) ||
               Object.values(uni.requirements).some(req => 
                   req.toLowerCase().includes(search)
               );
    });
    
    const container = document.getElementById('universitiesDisplay');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>No universities found matching your search</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map((uni, index) => `
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

// ===== Committee Management Functions =====
function bulkApprove() {
    const selectedGrants = getSelectedGrants();
    if (selectedGrants.length === 0) {
        showToast('Please select grants to approve', 'error');
        return;
    }
    
    selectedGrants.forEach(grantId => {
        const grant = grants.find(g => g.id === grantId);
        if (grant && grant.status === 'pending') {
            grant.status = 'approved';
            grant.txHash = generateMockTxHash();
        }
    });
    
    updateCommitteeView();
    showToast(`Approved ${selectedGrants.length} grants successfully!`, 'success');
}

function bulkReject() {
    const selectedGrants = getSelectedGrants();
    if (selectedGrants.length === 0) {
        showToast('Please select grants to reject', 'error');
        return;
    }
    
    selectedGrants.forEach(grantId => {
        const grant = grants.find(g => g.id === grantId);
        if (grant && grant.status === 'pending') {
            grant.status = 'rejected';
        }
    });
    
    updateCommitteeView();
    showToast(`Rejected ${selectedGrants.length} grants`, 'info');
}

function getSelectedGrants() {
    const checkboxes = document.querySelectorAll('.grant-checkbox:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value));
}

function exportDecisions() {
    const decisions = grants.map(grant => ({
        id: grant.id,
        studentName: grant.studentName,
        projectTitle: grant.projectTitle,
        status: grant.status,
        amount: grant.amount,
        submittedAt: grant.submittedAt,
        txHash: grant.txHash || 'N/A'
    }));
    
    const csv = convertToCSV(decisions);
    downloadCSV(csv, 'grant_decisions.csv');
    showToast('Decisions exported successfully!', 'success');
}

function convertToCSV(data) {
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    return csvContent;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function sendNotifications() {
    const pendingGrants = grants.filter(g => g.status === 'pending');
    const approvedGrants = grants.filter(g => g.status === 'approved');
    const rejectedGrants = grants.filter(g => g.status === 'rejected');
    
    let message = `Notifications sent to:\n`;
    message += `- ${pendingGrants.length} pending applicants\n`;
    message += `- ${approvedGrants.length} approved applicants\n`;
    message += `- ${rejectedGrants.length} rejected applicants`;
    
    showToast(message, 'info');
}

function viewStatistics() {
    const stats = {
        total: grants.length,
        pending: grants.filter(g => g.status === 'pending').length,
        approved: grants.filter(g => g.status === 'approved').length,
        rejected: grants.filter(g => g.status === 'rejected').length,
        totalFunding: grants.filter(g => g.status === 'approved').reduce((sum, g) => sum + g.amount, 0)
    };
    
    const message = `Grant Statistics:\n` +
        `Total Applications: ${stats.total}\n` +
        `Pending: ${stats.pending}\n` +
        `Approved: ${stats.approved}\n` +
        `Rejected: ${stats.rejected}\n` +
        `Total Funding: ${stats.totalFunding.toFixed(2)} ETH`;
    
    showToast(message, 'info');
}

// ===== Enhanced Committee View Update =====
function updateCommitteeViewEnhanced() {
    const pendingGrants = grants.filter(g => g.status === 'pending');
    const approvedGrants = grants.filter(g => g.status === 'approved');
    const rejectedGrants = grants.filter(g => g.status === 'rejected');
    
    document.getElementById('committeePending').textContent = pendingGrants.length;
    document.getElementById('committeeApproved').textContent = approvedGrants.length;
    document.getElementById('committeeRejected').textContent = rejectedGrants.length;
    document.getElementById('committeeVotes').textContent = committeeVotesToday;
    
    const container = document.getElementById('committeeGrantsDisplay');
    
    if (grants.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No applications to review</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = grants.map((grant, index) => `
        <div class="grant-card" style="animation-delay: ${index * 0.1}s">
            <div class="grant-header">
                <div class="grant-checkbox-wrapper">
                    <input type="checkbox" class="grant-checkbox" value="${grant.id}" id="grant-${grant.id}">
                    <label for="grant-${grant.id}" class="checkbox-label"></label>
                </div>
                <div>
                    <div class="grant-title">${grant.projectTitle}</div>
                    <div class="grant-info">👤 ${grant.studentName} - ${grant.institution}</div>
                </div>
                <span class="status-badge status-${grant.status}">${grant.status}</span>
            </div>
            <div class="grant-category">${getCategoryIcon(grant.category)} ${formatCategory(grant.category)}</div>
            <p class="grant-info" style="margin-top: 16px;"><strong>Description:</strong><br>${grant.projectDesc}</p>
            <div class="grant-amount">💰 ${grant.amount} ETH</div>
            <div class="grant-info">⏱️ ${grant.duration} months</div>
            <div class="grant-info">📅 ${grant.submittedAt}</div>
            <div class="grant-info">🔐 <code>${grant.walletAddress.substring(0, 15)}...${grant.walletAddress.slice(-10)}</code></div>
            
            ${grant.status === 'pending' ? `
                <div class="vote-section">
                    <div class="vote-buttons">
                        <button class="vote-btn vote-approve" onclick="vote(${grant.id}, 'approve')">
                            ✓ Approve
                        </button>
                        <button class="vote-btn vote-reject" onclick="vote(${grant.id}, 'reject')">
                            ✗ Reject
                        </button>
                    </div>
                    <div class="votes-count">
                        <span>👍 ${grant.votesApprove} Approve</span>
                        <span>👎 ${grant.votesReject} Reject</span>
                    </div>
                </div>
            ` : ''}
            
            ${grant.status === 'approved' && grant.txHash ? `
                <div class="tx-hash">✅ Funded: ${grant.txHash}</div>
            ` : ''}
            
            ${grant.status === 'rejected' ? `
                <div style="margin-top: 16px; padding: 14px; background: rgba(239, 68, 68, 0.1); border-radius: 12px; font-size: 0.9rem; color: #f87171;">
                    ❌ Application rejected
                </div>
            ` : ''}
        </div>
    `).join('');
}
