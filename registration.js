// ===== Registration Form Handler =====
document.addEventListener('DOMContentLoaded', function() {
    initializeRegistration();
});

function initializeRegistration() {
    const forms = document.querySelectorAll('form[id$="RegistrationForm"]');
    forms.forEach(form => {
        setupFormValidation(form);
        setupCharacterCounters(form);
        setupPasswordStrength(form);
    });
}

// ===== Form Validation =====
function setupFormValidation(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        // Real-time validation
        input.addEventListener('input', function() {
            validateField(this);
        });
        
        // Blur validation
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm(this)) {
            submitRegistration(this);
        }
    });
}

function validateField(field) {
    const formGroup = field.closest('.form-group');
    const indicator = formGroup.querySelector('.validation-indicator');
    const value = field.value.trim();
    
    // Remove existing error/success classes
    formGroup.classList.remove('error', 'success');
    
    // Remove existing error messages
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(formGroup, 'This field is required');
        return false;
    }
    
    // Skip validation if field is empty and not required
    if (!value && !field.hasAttribute('required')) {
        indicator.classList.remove('valid', 'invalid');
        return true;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(formGroup, 'Please enter a valid email address');
            return false;
        }
        
        // Gmail validation if pattern attribute requires it
        if (field.hasAttribute('pattern') && field.getAttribute('pattern').includes('gmail')) {
            if (!value.toLowerCase().endsWith('@gmail.com')) {
                showFieldError(formGroup, 'Необходимо использовать Gmail адрес (@gmail.com)');
                return false;
            }
        }
    }
    
    // URL validation
    if (field.type === 'url' && value) {
        try {
            new URL(value);
        } catch {
            showFieldError(formGroup, 'Please enter a valid URL');
            return false;
        }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            showFieldError(formGroup, 'Please enter a valid phone number');
            return false;
        }
    }
    
    // Password validation
    if (field.type === 'password' && value) {
        const passwordStrength = checkPasswordStrength(value);
        if (passwordStrength.score < 2) {
            showFieldError(formGroup, 'Password is too weak');
            return false;
        }
    }
    
    // Confirm password validation
    if (field.name === 'confirmPassword' && value) {
        const passwordField = formGroup.closest('form').querySelector('input[name="password"]');
        if (passwordField && value !== passwordField.value) {
            showFieldError(formGroup, 'Passwords do not match');
            return false;
        }
    }
    
    // Year validation
    if (field.name === 'foundedYear' && value) {
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (year < 1800 || year > currentYear) {
            showFieldError(formGroup, `Please enter a year between 1800 and ${currentYear}`);
            return false;
        }
    }
    
    // Checkbox group validation
    if (field.name === 'reviewCategories') {
        const checkboxes = formGroup.querySelectorAll('input[name="reviewCategories"]');
        const checked = Array.from(checkboxes).some(cb => cb.checked);
        if (!checked) {
            showFieldError(formGroup, 'Please select at least one category');
            return false;
        }
    }
    
    // Show success state
    showFieldSuccess(formGroup);
    return true;
}

function showFieldError(formGroup, message) {
    formGroup.classList.add('error');
    const indicator = formGroup.querySelector('.validation-indicator');
    if (indicator) {
        indicator.classList.add('invalid');
        indicator.classList.remove('valid');
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    formGroup.appendChild(errorDiv);
}

function showFieldSuccess(formGroup) {
    formGroup.classList.add('success');
    const indicator = formGroup.querySelector('.validation-indicator');
    if (indicator) {
        indicator.classList.add('valid');
        indicator.classList.remove('invalid');
    }
}

function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    // Special validation for checkbox groups
    const checkboxGroups = form.querySelectorAll('.checkbox-group');
    checkboxGroups.forEach(group => {
        const checkboxes = group.querySelectorAll('input[type="checkbox"]');
        const checked = Array.from(checkboxes).some(cb => cb.checked);
        if (!checked) {
            const formGroup = group.closest('.form-group');
            showFieldError(formGroup, 'Please select at least one option');
            isValid = false;
        }
    });
    
    return isValid;
}

// ===== Character Counters =====
function setupCharacterCounters(form) {
    const textareas = form.querySelectorAll('textarea[maxlength]');
    textareas.forEach(textarea => {
        const maxLength = parseInt(textarea.getAttribute('maxlength'));
        const counterId = textarea.id + 'CharCount';
        const counter = document.getElementById(counterId);
        
        if (counter) {
            textarea.addEventListener('input', function() {
                const count = this.value.length;
                counter.textContent = count;
                
                // Update counter color based on length
                if (count > maxLength * 0.9) {
                    counter.parentElement.classList.add('error');
                } else if (count > maxLength * 0.7) {
                    counter.parentElement.classList.add('warning');
                } else {
                    counter.parentElement.classList.remove('error', 'warning');
                }
                
                // Limit text if exceeds max length
                if (count > maxLength) {
                    this.value = this.value.substring(0, maxLength);
                    counter.textContent = maxLength;
                }
            });
        }
    });
}

// ===== Password Strength =====
function setupPasswordStrength(form) {
    const passwordFields = form.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
        if (field.name === 'password') {
            field.addEventListener('input', function() {
                updatePasswordStrength(this);
            });
        }
    });
}

function checkPasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) score++;
    else feedback.push('At least 8 characters');
    
    // Lowercase check
    if (/[a-z]/.test(password)) score++;
    else feedback.push('Lowercase letters');
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Uppercase letters');
    
    // Number check
    if (/\d/.test(password)) score++;
    else feedback.push('Numbers');
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('Special characters');
    
    return { score, feedback };
}

function updatePasswordStrength(field) {
    const formGroup = field.closest('.form-group');
    const strengthBar = formGroup.querySelector('.strength-fill');
    const strengthText = formGroup.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    const strength = checkPasswordStrength(field.value);
    
    // Reset classes
    strengthBar.classList.remove('weak', 'fair', 'good', 'strong');
    
    if (field.value.length === 0) {
        strengthBar.style.width = '0%';
        strengthText.textContent = 'Password strength';
        return;
    }
    
    switch (strength.score) {
        case 0:
        case 1:
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Weak password';
            break;
        case 2:
            strengthBar.classList.add('fair');
            strengthText.textContent = 'Fair password';
            break;
        case 3:
        case 4:
            strengthBar.classList.add('good');
            strengthText.textContent = 'Good password';
            break;
        case 5:
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Strong password';
            break;
    }
}

// ===== Form Submission =====
function submitRegistration(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Handle checkbox groups
    const checkboxGroups = form.querySelectorAll('.checkbox-group');
    checkboxGroups.forEach(group => {
        const name = group.querySelector('input[type="checkbox"]').name;
        const checked = Array.from(group.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        data[name] = checked;
    });
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        Processing...
    `;
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Show success message
        showSuccessMessage(form, data);
        
        // Set user status based on form type
        const formType = form.id.replace('RegistrationForm', '');
        if (formType === 'student') {
            // Store in localStorage for persistence
            localStorage.setItem('userStatus', 'student');
            localStorage.setItem('userData', JSON.stringify(data));
        } else if (formType === 'committee') {
            localStorage.setItem('userStatus', 'committee');
            localStorage.setItem('userData', JSON.stringify(data));
        } else if (formType === 'institution') {
            localStorage.setItem('userStatus', 'institution');
            localStorage.setItem('userData', JSON.stringify(data));
        }
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    }, 2000);
}

function showSuccessMessage(form, data) {
    const formType = form.id.replace('RegistrationForm', '');
    const typeNames = {
        'student': 'Student',
        'committee': 'Committee',
        'institution': 'Institution'
    };
    
    const message = document.createElement('div');
    message.className = 'success-message';
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        color: white;
        padding: 20px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
        z-index: 1000;
        max-width: 400px;
        font-weight: 600;
    `;
    
    message.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px;">🎉</div>
            <div>
                <div style="font-size: 1.1rem; margin-bottom: 4px;">Registration Successful!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">
                    Your ${typeNames[formType]} account has been created.
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(message);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// ===== Utility Functions =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} show`;
    toast.style.cssText = `
        position: fixed;
        bottom: 32px;
        right: 32px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        color: var(--bg-primary);
        padding: 20px 28px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        transform: translateX(400px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
        max-width: 400px;
        font-weight: 600;
    `;
    
    if (type === 'success') {
        toast.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
        toast.style.color = 'white';
    } else if (type === 'error') {
        toast.style.background = 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
        toast.style.color = 'white';
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
