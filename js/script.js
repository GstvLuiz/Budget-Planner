// Budget Planner JavaScript
class BudgetPlanner {
    constructor() {
        this.transactions = this.loadTransactions();
        this.currentEditId = null;
        this.chart = null;
        
        this.categories = {
            expense: [
                { value: 'alimentacao', label: 'Alimentação', icon: 'fas fa-utensils' },
                { value: 'transporte', label: 'Transporte', icon: 'fas fa-car' },
                { value: 'moradia', label: 'Moradia', icon: 'fas fa-home' },
                { value: 'lazer', label: 'Lazer', icon: 'fas fa-gamepad' },
                { value: 'saude', label: 'Saúde', icon: 'fas fa-heartbeat' },
                { value: 'educacao', label: 'Educação', icon: 'fas fa-graduation-cap' },
                { value: 'outros', label: 'Outros', icon: 'fas fa-ellipsis-h' }
            ],
            income: [
                { value: 'salario', label: 'Salário', icon: 'fas fa-briefcase' },
                { value: 'freelance', label: 'Freelance', icon: 'fas fa-laptop' },
                { value: 'investimentos', label: 'Investimentos', icon: 'fas fa-chart-line' },
                { value: 'outros', label: 'Outros', icon: 'fas fa-ellipsis-h' }
            ]
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateOverview();
        this.renderTransactions();
        this.renderChart();
        this.setCurrentDate();
        this.updateCategoryOptions();
    }
    
    setupEventListeners() {
        // Modal controls
        document.getElementById('addIncomeBtn').addEventListener('click', () => this.openModal('income'));
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.openModal('expense'));
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        
        // Form submission
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Type change
        document.querySelectorAll('input[name="type"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateCategoryOptions());
        });
        
        // Filters
        document.getElementById('filterType').addEventListener('change', () => this.renderTransactions());
        document.getElementById('filterCategory').addEventListener('change', () => this.renderTransactions());
        document.getElementById('chartPeriod').addEventListener('change', () => this.renderChart());
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // Modal backdrop click
        document.getElementById('transactionModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
        
        // View all transactions
        document.getElementById('viewAllBtn').addEventListener('click', () => {
            this.setActiveNav('transactions');
        });
    }
    
    openModal(type = 'expense') {
        const modal = document.getElementById('transactionModal');
        const form = document.getElementById('transactionForm');
        const title = document.getElementById('modalTitle');
        
        // Reset form
        form.reset();
        this.currentEditId = null;
        
        // Set type
        document.getElementById(type === 'income' ? 'typeIncome' : 'typeExpense').checked = true;
        
        // Update title and category options
        title.textContent = type === 'income' ? 'Adicionar Receita' : 'Adicionar Despesa';
        this.updateCategoryOptions();
        
        // Set current date
        this.setCurrentDate();
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('description').focus();
        }, 100);
    }
    
    closeModal() {
        const modal = document.getElementById('transactionModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentEditId = null;
    }
    
    updateCategoryOptions() {
        const typeRadios = document.querySelectorAll('input[name="type"]');
        const categorySelect = document.getElementById('category');
        let selectedType = 'expense';
        
        typeRadios.forEach(radio => {
            if (radio.checked) {
                selectedType = radio.value;
            }
        });
        
        // Clear existing options
        categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
        
        // Add categories for selected type
        this.categories[selectedType].forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.label;
            categorySelect.appendChild(option);
        });
    }
    
    setCurrentDate() {
        const dateInput = document.getElementById('date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transaction = {
            id: this.currentEditId || Date.now().toString(),
            description: formData.get('description') || document.getElementById('description').value,
            amount: parseFloat(document.getElementById('amount').value),
            type: document.querySelector('input[name="type"]:checked').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            timestamp: Date.now()
        };
        
        // Validate
        if (!transaction.description || !transaction.amount || !transaction.category || !transaction.date) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        if (transaction.amount <= 0) {
            alert('O valor deve ser maior que zero.');
            return;
        }
        
        // Add or update transaction
        if (this.currentEditId) {
            const index = this.transactions.findIndex(t => t.id === this.currentEditId);
            if (index !== -1) {
                this.transactions[index] = transaction;
            }
        } else {
            this.transactions.unshift(transaction);
        }
        
        // Save and update UI
        this.saveTransactions();
        this.updateOverview();
        this.renderTransactions();
        this.renderChart();
        this.closeModal();
        
        // Show success message
        this.showToast(this.currentEditId ? 'Transação atualizada!' : 'Transação adicionada!');
    }
    
    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;
        
        this.currentEditId = id;
        
        // Fill form
        document.getElementById('description').value = transaction.description;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById(transaction.type === 'income' ? 'typeIncome' : 'typeExpense').checked = true;
        document.getElementById('date').value = transaction.date;
        
        // Update category options and select
        this.updateCategoryOptions();
        setTimeout(() => {
            document.getElementById('category').value = transaction.category;
        }, 50);
        
        // Update modal title
        document.getElementById('modalTitle').textContent = 'Editar Transação';
        
        // Show modal
        document.getElementById('transactionModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    deleteTransaction(id) {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveTransactions();
            this.updateOverview();
            this.renderTransactions();
            this.renderChart();
            this.showToast('Transação excluída!');
        }
    }
    
    updateOverview() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });
        
        const totalIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const currentBalance = totalIncome - totalExpenses;
        
        // Update UI
        document.getElementById('currentBalance').textContent = this.formatCurrency(currentBalance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(totalExpenses);
        
        // Update balance change (simplified - could be compared to previous month)
        const balanceChange = document.getElementById('balanceChange');
        if (currentBalance >= 0) {
            balanceChange.textContent = '+0%';
            balanceChange.className = 'change positive';
        } else {
            balanceChange.textContent = '-0%';
            balanceChange.className = 'change negative';
        }
    }
    
    renderTransactions() {
        const container = document.getElementById('transactionsList');
        const filterType = document.getElementById('filterType').value;
        const filterCategory = document.getElementById('filterCategory').value;
        
        let filteredTransactions = this.transactions;
        
        // Apply filters
        if (filterType !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
        }
        
        if (filterCategory !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === filterCategory);
        }
        
        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filteredTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>Nenhuma transação encontrada</h3>
                    <p>Adicione sua primeira transação para começar.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredTransactions.map(transaction => {
            const category = this.getCategoryInfo(transaction.type, transaction.category);
            const formattedDate = this.formatDate(transaction.date);
            
            return `
                <div class="transaction-item" data-id="${transaction.id}">
                    <div class="transaction-icon ${transaction.type}">
                        <i class="${category.icon}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-category">${category.label}</div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                    </div>
                    <div class="transaction-date">${formattedDate}</div>
                    <div class="transaction-actions">
                        <button class="btn-icon" onclick="budgetPlanner.editTransaction('${transaction.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="budgetPlanner.deleteTransaction('${transaction.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderChart() {
        const canvas = document.getElementById('expenseChart');
        const ctx = canvas.getContext('2d');
        const period = document.getElementById('chartPeriod').value;
        
        // Get filtered transactions based on period
        const filteredTransactions = this.getTransactionsByPeriod(period)
            .filter(t => t.type === 'expense');
        
        if (filteredTransactions.length === 0) {
            // Show empty state
            canvas.style.display = 'none';
            document.getElementById('chartLegend').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <h3>Nenhum dado para exibir</h3>
                    <p>Adicione algumas despesas para ver o gráfico.</p>
                </div>
            `;
            return;
        }
        
        canvas.style.display = 'block';
        
        // Group by category
        const categoryTotals = {};
        filteredTransactions.forEach(transaction => {
            if (!categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] = 0;
            }
            categoryTotals[transaction.category] += transaction.amount;
        });
        
        // Prepare chart data
        const labels = Object.keys(categoryTotals).map(cat => {
            const categoryInfo = this.getCategoryInfo('expense', cat);
            return categoryInfo.label;
        });
        
        const data = Object.values(categoryTotals);
        const colors = [
            '#6366f1', '#10b981', '#ef4444', '#f59e0b', 
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
        ];
        
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }
        
        // Create new chart
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 0,
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = this.formatCurrency(context.raw);
                                const percentage = ((context.raw / data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Update legend
        this.updateChartLegend(categoryTotals, colors);
    }
    
    updateChartLegend(categoryTotals, colors) {
        const legend = document.getElementById('chartLegend');
        const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
        
        legend.innerHTML = Object.entries(categoryTotals).map(([category, amount], index) => {
            const categoryInfo = this.getCategoryInfo('expense', category);
            const percentage = ((amount / total) * 100).toFixed(1);
            
            return `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${colors[index]}"></div>
                    <div class="legend-label">${categoryInfo.label}</div>
                    <div class="legend-value">${this.formatCurrency(amount)} (${percentage}%)</div>
                </div>
            `;
        }).join('');
    }
    
    getTransactionsByPeriod(period) {
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        return this.transactions.filter(t => new Date(t.date) >= startDate);
    }
    
    getCategoryInfo(type, categoryValue) {
        const category = this.categories[type].find(c => c.value === categoryValue);
        return category || { label: 'Outros', icon: 'fas fa-ellipsis-h' };
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(Math.abs(amount));
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        const icon = document.querySelector('#themeToggle i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    handleNavigation(e) {
        const section = e.currentTarget.getAttribute('data-section');
        this.setActiveNav(section);
    }
    
    setActiveNav(section) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Handle section visibility (simplified for this demo)
        // In a real app, you might want to show/hide different sections
        if (section === 'transactions') {
            document.querySelector('.transactions-section').scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
    }
    
    showToast(message) {
        // Simple toast notification (you could enhance this)
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: var(--shadow-lg);
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    loadTransactions() {
        const stored = localStorage.getItem('budgetPlannerTransactions');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveTransactions() {
        localStorage.setItem('budgetPlannerTransactions', JSON.stringify(this.transactions));
    }
    
    // Initialize theme
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.budgetPlanner = new BudgetPlanner();
    budgetPlanner.initTheme();
});

