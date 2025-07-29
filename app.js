// Aplicação de Benchmarks de Eventos 60+
// Carrega dados JSON e gerencia navegação, filtros e modais

class EventsBenchmarkApp {
    constructor() {
        this.data = null;
        this.currentFilter = '';
        this.currentSection = 'home';
        this.fallbackData = this.getFallbackData();
        this.init();
    }

    getFallbackData() {
        // Fallback mínimo: vazio, pois agora sempre tentaremos carregar o JSON local
        return {};
    }

    async init() {
        try {
            await this.loadData();
        } catch (error) {
            console.error('Erro ao carregar dados, usando dados de fallback:', error);
            this.data = this.fallbackData;
        }
        
        this.setupEventListeners();
        this.handleInitialRoute();
        this.renderEvents();
        this.renderTrends();
        this.renderPlanning();
        this.hideLoading();
    }

    async loadData() {
        try {
            const response = await fetch('benchmark_eventos_seniores.json');
            if (!response.ok) {
                throw new Error('Falha ao carregar benchmark_eventos_seniores.json');
            }
            const data = await response.json();
            this.data = data;
        } catch (error) {
            console.warn('Falha ao carregar benchmark_eventos_seniores.json:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Navegação
        document.querySelectorAll('.nav__item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Filtro de busca
        const searchInput = document.getElementById('search-filter');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilter = e.target.value.toLowerCase();
                this.filterEvents();
            });
        }

        // Headers colapsáveis
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleCollapsible(header);
            });
        });

        // Modal close
        const modalClose = document.querySelector('.modal__close');
        const modalBackdrop = document.querySelector('.modal__backdrop');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeEventModal());
        }
        
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => this.closeEventModal());
        }

        // Navegação por hash
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEventModal();
            }
        });
    }

    handleInitialRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        this.navigateToSection(hash);
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1) || 'home';
        this.navigateToSection(hash);
    }

    navigateToSection(section) {
        // Atualizar navegação visual
        document.querySelectorAll('.nav__item').forEach(item => {
            item.classList.remove('nav__item--active');
        });
        
        const navItem = document.querySelector(`[data-section="${section}"]`);
        if (navItem) {
            navItem.classList.add('nav__item--active');
        }

        // Mostrar seção correspondente
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('section--active');
        });
        
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('section--active');
        }

        // Atualizar hash se necessário
        if (window.location.hash.slice(1) !== section) {
            window.location.hash = section;
        }
        this.currentSection = section;
    }

    renderEvents() {
        // Não renderiza mais eventos na home, conforme solicitado.
        // Função mantida para compatibilidade, mas sem efeito.
    }

    renderEventGrid(gridId, events) {
        const grid = document.getElementById(gridId);
        if (!grid || !events) return;

        grid.innerHTML = '';

        Object.entries(events).forEach(([eventName, eventData]) => {
            const card = this.createEventCard(eventName, eventData);
            grid.appendChild(card);
        });
    }

    createEventCard(eventName, eventData) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Ver detalhes do evento ${eventName}`);

        // Suporte para diferentes formatos de local
        const location = this.formatLocation(eventData.local);
        const capacity = eventData.capacidade || 'Não informado';
        const venue = eventData.tipo_espaco || 'Não informado';
        const dataEvento = eventData.duracao || '';

        card.innerHTML = `
            <h3 class="event-card__title">${eventName}</h3>
            <div class="event-card__location">
                <span>📍</span>
                <span>${location}</span>
            </div>
            <div class="event-card__details">
                <div class="event-card__detail">
                    <strong>Local:</strong> ${venue}
                </div>
                <div class="event-card__detail">
                    <strong>Capacidade:</strong> ${capacity}
                </div>
                <div class="event-card__detail">
                    <strong>Data/Duração:</strong> ${dataEvento}
                </div>
            </div>
        `;

        // Adicionar dados para filtro
        const temas = Array.isArray(eventData.temas) ? eventData.temas.join(' ') : (eventData.temas || '');
        card.dataset.searchText = `${eventName} ${location} ${venue} ${temas}`.toLowerCase();

        // Event listeners para modal
        const showModal = () => this.showEventModal(eventName, eventData);
        card.addEventListener('click', showModal);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showModal();
            }
        });

        return card;
    }

    showEventModal(eventName, eventData) {
        const modal = document.getElementById('event-modal');
        const title = document.getElementById('modal-title');
        const content = document.getElementById('modal-content');

        if (!modal || !title || !content) return;

        title.textContent = eventName;
        content.innerHTML = this.generateEventDetails(eventData);

        modal.classList.remove('hidden');
        
        // Focus no modal para acessibilidade
        const closeButton = modal.querySelector('.modal__close');
        if (closeButton) {
            closeButton.focus();
        }
    }

    closeEventModal() {
        const modal = document.getElementById('event-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    generateEventDetails(eventData) {
        // Adaptação para eventos do JSON real
        const details = [
            { label: 'Local', content: this.formatLocation(eventData.local) },
            { label: 'Tipo de Espaço', content: eventData.tipo_espaco || 'Não informado' },
            { label: 'Capacidade', content: eventData.capacidade || 'Não informado' },
            { label: 'Formato', content: this.formatList(eventData.formato) },
            { label: 'Duração', content: eventData.duracao || 'Não informado' },
            { label: 'Temas Abordados', content: this.formatList(eventData.temas) },
            { label: 'Atividades', content: this.formatList(eventData.atividades || eventData.atividades_dinamicas) },
            { label: 'Organizadores', content: this.formatList(eventData.organizadores) },
            { label: 'Parceiros', content: this.formatList(eventData.parceiros) },
            { label: 'Networking', content: eventData.networking || this.formatList(eventData.networking_integracao) },
            { label: 'Impacto', content: eventData.impacto || eventData.impacto_feedback || 'Não informado' }
        ];

        let html = '';
        details.forEach(detail => {
            if (detail.content && detail.content !== 'Não informado') {
                html += `
                    <div class="event-detail">
                        <span class="event-detail__label">${detail.label}</span>
                        <div class="event-detail__content">${detail.content}</div>
                    </div>
                `;
            }
        });

        // Links
        if (eventData.links) {
            // Suporte para string ou array
            const linksArr = Array.isArray(eventData.links) ? eventData.links : [eventData.links];
            html += `
                <div class="event-detail">
                    <span class="event-detail__label">Links e Recursos</span>
                    <div class="event-detail__links">
                        ${linksArr.map(link => 
                            `<a href="${link}" target="_blank" rel="noopener noreferrer" class="event-detail__link">
                                Ver mais 🔗
                            </a>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    }

    formatLocation(local) {
        if (!local) return 'Não informado';
        if (typeof local === 'string') return local;
        if (typeof local === 'object') {
            const cidade = local.cidade || '';
            const pais = local.pais || '';
            return `${cidade}, ${pais}`.replace(/^, |, $/, '') || 'Não informado';
        }
        return 'Não informado';
    }

    formatList(items) {
        if (!items) return 'Não informado';
        if (Array.isArray(items)) {
            return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
        }
        return items;
    }

    formatObject(obj) {
        if (!obj) return 'Não informado';
        if (typeof obj === 'string') return obj;
        if (typeof obj === 'object') {
            const entries = Object.entries(obj);
            if (entries.length === 0) return 'Não informado';
            return `<ul>${entries.map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}</ul>`;
        }
        return 'Não informado';
    }

    filterEvents() {
        const cards = document.querySelectorAll('.event-card');
        let brasilHasCards = false;
        let internationalHasCards = false;

        cards.forEach(card => {
            const searchText = card.dataset.searchText || '';
            const isVisible = !this.currentFilter || searchText.includes(this.currentFilter);
            
            card.style.display = isVisible ? 'block' : 'none';
            
            // Verificar se o card pertence ao grid do Brasil ou Internacional
            const brasilGrid = document.getElementById('brasil-grid');
            const internationalGrid = document.getElementById('international-grid');
            
            if (isVisible) {
                if (brasilGrid && brasilGrid.contains(card)) {
                    brasilHasCards = true;
                }
                if (internationalGrid && internationalGrid.contains(card)) {
                    internationalHasCards = true;
                }
            }
        });

        // Mostrar estado vazio se necessário
        this.toggleEmptyState('brasil-grid', brasilHasCards);
        this.toggleEmptyState('international-grid', internationalHasCards);
    }

    toggleEmptyState(gridId, hasCards) {
        const grid = document.getElementById(gridId);
        if (!grid) return;
        
        let emptyState = grid.querySelector('.empty-state');
        
        if (!hasCards && this.currentFilter) {
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `
                    <h3>Nenhum evento encontrado</h3>
                    <p>Tente ajustar o filtro de busca para encontrar eventos relevantes.</p>
                `;
                grid.appendChild(emptyState);
            }
        } else if (emptyState) {
            emptyState.remove();
        }
    }

    toggleCollapsible(header) {
        const target = header.dataset.target;
        const content = document.getElementById(target);
        const icon = header.querySelector('.collapsible-icon');
        
        if (!content || !icon) return;
        
        const isOpen = header.classList.contains('collapsible-header--open');

        if (isOpen) {
            header.classList.remove('collapsible-header--open');
            content.classList.remove('collapsible-content--open');
            icon.textContent = '+';
        } else {
            header.classList.add('collapsible-header--open');
            content.classList.add('collapsible-content--open');
            icon.textContent = '−';
        }
    }

    renderTrends() {
        if (!this.data?.tendencias_2025_2026) return;

        const container = document.querySelector('.trends-container');
        if (!container) return;
        
        const trends = this.data.tendencias_2025_2026;

        container.innerHTML = Object.entries(trends).map(([category, items]) => `
            <div class="trend-category">
                <h3>${this.formatCategoryTitle(category)}</h3>
                <ul class="trend-list">
                    ${Array.isArray(items) ? items.map(item => `<li>${item}</li>`).join('') : `<li>${items}</li>`}
                </ul>
            </div>
        `).join('');
    }

    formatCategoryTitle(category) {
        const titles = {
            'tecnologias_assistivas': 'Tecnologias Assistivas',
            'gamificacao': 'Gamificação',
            'experiencias_sensoriais': 'Experiências Sensoriais',
            'formatos_inovadores': 'Formatos Inovadores',
            'inclusao_participacao': 'Inclusão e Participação'
        };
        return titles[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    renderPlanning() {
        const container = document.querySelector('.planning-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="planning-section">
                <h3>🎯 Visão Geral do Evento</h3>
                <p><strong>Data:</strong> 01 de outubro de 2025</p>
                <p><strong>Local:</strong> Teatro SESC (350 lugares)</p>
                <p><strong>Público-alvo:</strong> Adultos 60+ interessados em cultura, educação e bem-estar</p>
                <p><strong>Duração:</strong> 4 horas (13h30 às 17h30)</p>
            </div>

            <div class="planning-section">
                <h3>📋 Formato Recomendado</h3>
                <p>Com base nos benchmarks analisados e no tempo disponível de 3 horas, sugerimos:</p>
                <ul>
                    <li><strong>Palestra de abertura</strong> com apresentação </li>
                    <li><strong>Palestra de destaque</strong> com apresentação </li>
                    <li><strong>Intervalo para networking</strong> com café/break</li>
                    <li><strong>Painel de encerramento</strong> com apresentação </li>
                    <li><strong>Networking final</strong> e premiação</li>
                </ul>
            </div>

            <div class="planning-section">
                <h3>🏆 Categorias em destaque para premiação</h3>
                <ul>
                    <li><strong>Cultura Digital:</strong> Inclusão digital e novas tecnologias</li>
                    <li><strong>Bem-estar Integral:</strong> Saúde física, mental e social</li>
                    <li><strong>Educação Continuada:</strong> Aprendizado ao longo da vida</li>
                    <li><strong>Protagonismo Social:</strong> Liderança e participação ativa</li>
                    <li><strong>Expressão Cultural:</strong> Arte, música e criatividade</li>
                </ul>
            </div>

            <div class="planning-section">
                <h3>🏢 Fornecedores Recomendados</h3>
                <ul>
                    <li><strong>Sonorização:</strong> Sistema de som com assistência auditiva (loops de indução)</li>
                    <li><strong>Mobiliário:</strong> Cadeiras ergonômicas, mesas ajustáveis para oficinas</li>
                    <li><strong>Tecnologia:</strong> Telas grandes, projetores de alta definição, Wi-Fi robusto</li>
                    <li><strong>Acessibilidade:</strong> Rampas, sinalização aumentada, intérpretes de libras</li>
                    <li><strong>Catering:</strong> Opções saudáveis, dietéticas e fáceis de consumir</li>
                </ul>
            </div>

            <div class="planning-section">
                <h3>🤝 Ações de Networking Intergeracional</h3>
                <ul>
                    <li><strong>Speed Networking:</strong> Conversas rápidas entre participantes de diferentes idades</li>
                    <li><strong>Mentoria Reversa:</strong> Jovens ensinando tecnologia, seniores compartilhando experiência</li>
                    <li><strong>Workshops Colaborativos:</strong> Projetos em duplas intergeracionais</li>
                    <li><strong>Mural de Conexões:</strong> Espaço físico para deixar contatos e interesses</li>
                    <li><strong>App de Networking:</strong> Plataforma simples para facilitar conexões pós-evento</li>
                </ul>
            </div>

            <div class="planning-section">
                <h3>📊 Estratégias de Engajamento</h3>
                <ul>
                    <li><strong>Gamificação Simples:</strong> Sistema de pontos por participação</li>
                    <li><strong>Storytelling:</strong> Momentos para compartilhar histórias pessoais</li>
                    <li><strong>Atividades Sensoriais:</strong> Degustação, aromaterapia, música ao vivo</li>
                    <li><strong>Tecnologia Assistiva:</strong> Tradução simultânea, legendas em tempo real</li>
                    <li><strong>Pausas Ativas:</strong> Alongamentos e exercícios entre sessões</li>
                </ul>
            </div>
        `;
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    new EventsBenchmarkApp();
});