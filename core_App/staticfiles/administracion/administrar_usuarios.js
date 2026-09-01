// Administrar Usuarios - JavaScript

class AdministrarUsuarios {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.currentAction = null;
        this.currentUserId = null;
        this.searchTimeout = null;
        this.currentStatusFilter = 'all';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUsers();
    }

    setupEventListeners() {
        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.applyFilters();
            }, 300);
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentStatusFilter = e.target.value;
            this.applyFilters();
        });

        // Clear search button
        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            this.applyFilters();
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadUsers();
        });

        // Password modal events
        document.getElementById('closePasswordModal').addEventListener('click', () => {
            this.closePasswordModal();
        });

        document.getElementById('cancelPasswordBtn').addEventListener('click', () => {
            this.closePasswordModal();
        });

        document.getElementById('savePasswordBtn').addEventListener('click', () => {
            this.changePassword();
        });

        // Confirm modal events
        document.getElementById('closeConfirmModal').addEventListener('click', () => {
            this.closeConfirmModal();
        });

        document.getElementById('cancelConfirmBtn').addEventListener('click', () => {
            this.closeConfirmModal();
        });

        document.getElementById('confirmActionBtn').addEventListener('click', () => {
            this.executeAction();
        });

        // Toast close
        document.getElementById('toastClose').addEventListener('click', () => {
            this.hideToast();
        });

        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = e.currentTarget.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });

        // Close modals on background click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                if (e.target.id === 'passwordModal') {
                    this.closePasswordModal();
                } else if (e.target.id === 'confirmModal') {
                    this.closeConfirmModal();
                }
            }
        });

        // Form validation
        document.getElementById('confirmPassword').addEventListener('input', () => {
            this.validatePasswordForm();
        });

        document.getElementById('newPassword').addEventListener('input', () => {
            this.validatePasswordForm();
        });
    }

    async loadUsers() {
        try {
            this.showLoading();
            
            // Verificar que CONFIG esté disponible
            if (typeof CONFIG === 'undefined') {
                throw new Error('CONFIG is not defined. Please check that config.js is loaded correctly.');
            }
            
            const response = await fetch(`${CONFIG.API_BASE}/administrar-usuarios/`);
            const data = await response.json();
            
            if (data.success) {
                this.users = data.data;
                this.applyFilters();
                this.hideLoading();
            } else {
                throw new Error(data.error || 'Error al cargar usuarios');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Error al cargar los usuarios: ' + error.message);
            this.hideLoading();
        }
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        
        // Aplicar filtro de búsqueda
        let filtered = [...this.users];
        
        if (searchTerm !== '') {
            filtered = filtered.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                user.nom_provee.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                (user.first_name && user.first_name.toLowerCase().includes(searchTerm)) ||
                (user.last_name && user.last_name.toLowerCase().includes(searchTerm))
            );
            document.getElementById('clearSearchBtn').style.display = 'block';
        } else {
            document.getElementById('clearSearchBtn').style.display = 'none';
        }
        
        // Aplicar filtro de estado
        if (this.currentStatusFilter === 'active') {
            filtered = filtered.filter(user => user.is_active === true);
        } else if (this.currentStatusFilter === 'inactive') {
            filtered = filtered.filter(user => user.is_active === false);
        }
        // Si es 'all', no filtramos por estado
        
        this.filteredUsers = filtered;
        this.renderUsers();
        this.updateStats();
    }

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        const noResults = document.getElementById('noResultsMessage');
        
        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = '';
            noResults.style.display = 'block';
            document.querySelector('.table-container').style.display = 'none';
            return;
        }
        
        noResults.style.display = 'none';
        document.querySelector('.table-container').style.display = 'block';
        
        tbody.innerHTML = this.filteredUsers.map(user => `
            <tr>
                <td>
                    <div>
                        <strong>${this.escapeHtml(user.nom_provee)}</strong>
                        ${user.cod_cpa01 ? `<br><small>Código: ${this.escapeHtml(user.cod_cpa01)}</small>` : ''}
                    </div>
                </td>
                <td>
                    <strong>${this.escapeHtml(user.username)}</strong>
                </td>
                <td>
                    ${this.escapeHtml(user.email || '-')}
                </td>
                <td>
                    ${user.fecha_alta ? this.formatDate(user.fecha_alta) : 
                      (user.date_joined ? this.formatDate(user.date_joined) : '-')}
                </td>
                <td>
                    <span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
                        <i class="fas ${user.is_active ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}" 
                            onclick="adminUsuarios.toggleUserStatus(${user.user_id}, '${this.escapeHtml(user.username)}', ${user.is_active})">
                        <i class="fas ${user.is_active ? 'fa-ban' : 'fa-check'}"></i>
                        ${user.is_active ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                    <button class="btn btn-sm btn-primary" 
                            onclick="adminUsuarios.openPasswordModal(${user.user_id}, '${this.escapeHtml(user.username)}')">
                        <i class="fas fa-key"></i>
                        Cambiar Contraseña
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        const total = this.filteredUsers.length;
        const active = this.filteredUsers.filter(user => user.is_active).length;
        const inactive = total - active;
        
        document.getElementById('totalUsers').textContent = total;
        document.getElementById('activeUsers').textContent = active;
        document.getElementById('inactiveUsers').textContent = inactive;
    }

    toggleUserStatus(userId, username, currentStatus) {
        this.currentUserId = userId;
        this.currentAction = 'toggle_active';
        
        const action = currentStatus ? 'deshabilitar' : 'habilitar';
        const message = `¿Estás seguro de que deseas ${action} al usuario "${username}"?`;
        
        this.showConfirmModal(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Usuario`,
            message,
            currentStatus ? 'btn-warning' : 'btn-success'
        );
    }

    openPasswordModal(userId, username) {
        this.currentUserId = userId;
        
        document.getElementById('modalUsername').value = username;
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('passwordModal').style.display = 'block';
        
        // Focus on password field
        setTimeout(() => {
            document.getElementById('newPassword').focus();
        }, 100);
    }

    closePasswordModal() {
        document.getElementById('passwordModal').style.display = 'none';
        this.currentUserId = null;
    }

    showConfirmModal(title, message, btnClass = 'btn-primary') {
        document.getElementById('confirmTitle').innerHTML = `<i class="fas fa-question-circle"></i> ${title}`;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmActionBtn').className = `btn ${btnClass}`;
        document.getElementById('confirmModal').style.display = 'block';
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.currentAction = null;
        this.currentUserId = null;
    }

    async executeAction() {
        if (!this.currentAction || !this.currentUserId) return;
        
        try {
            // Verificar que CONFIG esté disponible
            if (typeof CONFIG === 'undefined') {
                throw new Error('CONFIG is not defined');
            }
            
            const response = await fetch(`${CONFIG.API_BASE}/administrar-usuarios/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: this.currentUserId,
                    action: this.currentAction
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(data.message, 'success');
                this.closeConfirmModal();
                this.loadUsers(); // Reload to get updated data
            } else {
                throw new Error(data.error || 'Error al ejecutar la acción');
            }
        } catch (error) {
            console.error('Error executing action:', error);
            this.showToast('Error: ' + error.message, 'error');
        }
    }

    validatePasswordForm() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const saveBtn = document.getElementById('savePasswordBtn');
        
        const isValid = newPassword.length >= 6 && newPassword === confirmPassword;
        saveBtn.disabled = !isValid;
        
        if (confirmPassword && newPassword !== confirmPassword) {
            document.getElementById('confirmPassword').style.borderColor = 'var(--danger-color)';
        } else {
            document.getElementById('confirmPassword').style.borderColor = 'var(--border-color)';
        }
    }

    async changePassword() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword.length < 6) {
            this.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showToast('Las contraseñas no coinciden', 'error');
            return;
        }
        
        try {
            // Verificar que CONFIG esté disponible
            if (typeof CONFIG === 'undefined') {
                throw new Error('CONFIG is not defined');
            }
            
            const response = await fetch(`${CONFIG.API_BASE}/administrar-usuarios/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: this.currentUserId,
                    action: 'change_password',
                    new_password: newPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(data.message, 'success');
                this.closePasswordModal();
            } else {
                throw new Error(data.error || 'Error al cambiar la contraseña');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showToast('Error: ' + error.message, 'error');
        }
    }

    showLoading() {
        document.getElementById('loadingIndicator').style.display = 'flex';
        document.getElementById('errorMessage').style.display = 'none';
        document.querySelector('.table-container').style.display = 'none';
        document.getElementById('noResultsMessage').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
    }

    showError(message) {
        document.getElementById('errorText').textContent = message;
        document.getElementById('errorMessage').style.display = 'flex';
        document.querySelector('.table-container').style.display = 'none';
        document.getElementById('noResultsMessage').style.display = 'none';
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toastIcon');
        const messageEl = document.getElementById('toastMessage');
        
        // Set message
        messageEl.textContent = message;
        
        // Set type
        toast.className = `toast ${type}`;
        
        if (type === 'success') {
            icon.className = 'fas fa-check-circle';
        } else if (type === 'error') {
            icon.className = 'fas fa-exclamation-triangle';
        }
        
        // Show toast
        toast.style.display = 'flex';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideToast();
        }, 5000);
    }

    hideToast() {
        document.getElementById('toast').style.display = 'none';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
let adminUsuarios;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar que CONFIG esté disponible antes de inicializar
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG is not defined. Check that config.js is loading correctly.');
        document.getElementById('errorText').textContent = 'Error de configuración: CONFIG no está definido. Verifique que config.js se esté cargando correctamente.';
        document.getElementById('errorMessage').style.display = 'flex';
        return;
    }
    
    adminUsuarios = new AdministrarUsuarios();
});

// Global functions for inline event handlers
window.adminUsuarios = {
    toggleUserStatus: (userId, username, currentStatus) => {
        if (adminUsuarios) {
            adminUsuarios.toggleUserStatus(userId, username, currentStatus);
        }
    },
    openPasswordModal: (userId, username) => {
        if (adminUsuarios) {
            adminUsuarios.openPasswordModal(userId, username);
        }
    }
};