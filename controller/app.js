// Estado global da aplicação
let state = {
    jogos: [],
    times: [],
    competidores: [],
    confrontos: [],
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    configurarNavegacao();
    renderizarTudo();

    iniciarFogos();

    // 🎆 Solta fogos ao abrir o site
    setTimeout(() => {
        lancarFogos();
    }, 800);
});

// Busca todos os dados via service
async function carregarDados() {
    try {
        const [jogos, times, competidores, confrontos] = await Promise.all([
            getJogos(),
            getTimes(),
            getCompetidores(),
            getConfrontos(),
        ]);

        state.jogos = jogos;
        state.times = times;
        state.competidores = competidores;
        state.confrontos = confrontos;
    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
    }
}

// Configura cliques na navegação lateral
function configurarNavegacao() {
    const itens = document.querySelectorAll('#sidebar-nav li');

    itens.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            trocarView(view);
            itens.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function trocarView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');
}

function renderizarTudo() {
    renderizarDashboard();
    renderizarJogos();
    renderizarTimes();
    renderizarCompetidores();
    renderizarConfrontos();
    renderizarElementoInteligente();
}

// --- Elemento inteligente: Próximo confronto ---

function renderizarElementoInteligente() {
    const container = document.getElementById('smart-element');

    if (!container) return;

    const agora = new Date();

    const proximos = state.confrontos
        .filter(c => c.status === 'scheduled')
        .map(c => ({
            ...c,
            dataJogo: new Date(c.date)
        }))
        .filter(c => c.dataJogo >= agora)
        .sort((a, b) => a.dataJogo - b.dataJogo);

    // Se não houver nenhum confronto
    if (proximos.length === 0) {

        container.innerHTML = `
            <div class="smart-card smart-empty">

                <div class="smart-empty-icon">
                    <i class="fas fa-trophy"></i>
                </div>

                <div>
                    <span class="smart-label">
                        CENTRAL DA ARENA
                    </span>

                    <h2>
                        Nenhum confronto agendado
                    </h2>

                    <p>
                        Quando um novo confronto for registrado,
                        ele aparecerá aqui automaticamente.
                    </p>
                </div>

            </div>
        `;

        return;
    }

    // Pega automaticamente o próximo confronto
    const confronto = proximos[0];

    const jogo = state.jogos.find(
        j => j.id == confronto.gameId
    );

    const time1 = state.times.find(
        t => t.id == confronto.team1Id
    );

    const time2 = state.times.find(
        t => t.id == confronto.team2Id
    );

    const dataFormatada =
        confronto.dataJogo.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
        });

    const horaFormatada =
        confronto.dataJogo.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

    container.innerHTML = `

        <div class="smart-card">

            <div class="smart-top">

                <div>

                    <span class="smart-label">
                        <i class="fas fa-bolt"></i>
                        PRÓXIMO CONFRONTO
                    </span>

                    <h2>
                        ${jogo?.name || 'Jogo'}
                    </h2>

                    <p>
                        ${dataFormatada} às ${horaFormatada}
                    </p>

                </div>

                <div class="smart-status">
                    AGENDADO
                </div>

            </div>


            <div class="smart-match">

                <div class="smart-team">

                    <div
                        class="smart-team-color"
                        style="background:${time1?.color || '#6366f1'}">
                    </div>

                    <strong>
                        ${time1?.name || 'TBD'}
                    </strong>

                </div>


                <div class="smart-vs">

                    <span>VS</span>

                </div>


                <div class="smart-team">

                    <div
                        class="smart-team-color"
                        style="background:${time2?.color || '#6366f1'}">
                    </div>

                    <strong>
                        ${time2?.name || 'TBD'}
                    </strong>

                </div>

            </div>


            <div class="smart-countdown">

                <span id="smart-countdown">
                    --:--:--
                </span>

                <small>
                    tempo restante
                </small>

            </div>

        </div>
    `;

    iniciarContagem(confronto.dataJogo);
}

let intervaloContagem;

function iniciarContagem(dataJogo) {

    clearInterval(intervaloContagem);

    const elemento =
        document.getElementById('smart-countdown');

    if (!elemento) return;

    function atualizar() {

        const agora = new Date();

        const diferenca =
            dataJogo - agora;

        // Quando chegar a hora
        if (diferenca <= 0) {

            elemento.textContent = 'AO VIVO';

            const status =
                document.querySelector('.smart-status');

            if (status) {
                status.textContent = '🔴 AO VIVO';
                status.classList.add('live');
            }

            clearInterval(intervaloContagem);

            return;
        }

        const horas = Math.floor(
            diferenca / (1000 * 60 * 60)
        );

        const minutos = Math.floor(
            (diferenca % (1000 * 60 * 60))
            / (1000 * 60)
        );

        const segundos = Math.floor(
            (diferenca % (1000 * 60))
            / 1000
        );

        elemento.textContent =
            `${String(horas).padStart(2, '0')}:` +
            `${String(minutos).padStart(2, '0')}:` +
            `${String(segundos).padStart(2, '0')}`;
    }

    atualizar();

    intervaloContagem =
        setInterval(atualizar, 1000);
}

// --- Funções de renderização ---

function renderizarDashboard() {
    const stats = document.getElementById('dashboard-stats');
    const proximos = document.getElementById('upcoming-matches');

    const encerrados = state.confrontos.filter(c => c.status === 'finished').length;
    const agendados = state.confrontos.filter(c => c.status === 'scheduled').length;

    stats.innerHTML = `
        <div class="card">
            <span class="card-tag">Torneio</span>
            <h3>${state.times.length}</h3>
            <p class="subtitle">Equipes</p>
        </div>
        <div class="card">
            <span class="card-tag">Atletas</span>
            <h3>${state.competidores.length}</h3>
            <p class="subtitle">Competidores</p>
        </div>
        <div class="card">
            <span class="card-tag">Encerrados</span>
            <h3>${encerrados}</h3>
            <p class="subtitle">Resultados</p>
        </div>
        <div class="card">
            <span class="card-tag">Pendentes</span>
            <h3>${agendados}</h3>
            <p class="subtitle">Agendamentos</p>
        </div>
    `;

    const lista = state.confrontos.filter(c => c.status === 'scheduled').slice(0, 3);

    proximos.innerHTML = lista.map(c => {
        const jogo = state.jogos.find(j => j.id == c.gameId);
        const time1 = state.times.find(t => t.id == c.team1Id);
        const time2 = state.times.find(t => t.id == c.team2Id);
        return `
            <div class="card">
                <span class="card-tag">${jogo?.name || 'Jogo'}</span>
                <div class="match-card">
                    <div class="team-score"><strong>${time1?.name || 'TBD'}</strong></div>
                    <div class="vs">VS</div>
                    <div class="team-score"><strong>${time2?.name || 'TBD'}</strong></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderizarJogos() {
    const lista = document.getElementById('list-jogos');
    lista.innerHTML = state.jogos.map(j => `
        <div class="card">
            <span class="card-tag">${j.genre}</span>
            <h3>${j.name}</h3>
            <p class="subtitle">ID: ${j.id}</p>
        </div>
    `).join('');
}

function renderizarTimes() {
    const lista = document.getElementById('list-times');
    lista.innerHTML = state.times.map(t => `
        <div class="card" style="border-right: 4px solid ${t.color}">
            <span class="card-tag">EQUIPE</span>
            <h3>${t.name}</h3>
            <p class="subtitle">${state.competidores.filter(c => c.teamId == t.id).length} Jogadores</p>
        </div>
    `).join('');
}

function renderizarCompetidores() {
    const lista = document.getElementById('list-competidores');
    lista.innerHTML = state.competidores.map(c => {
        const time = state.times.find(t => t.id == c.teamId);
        return `
            <div class="card">
                <span class="card-tag">${time?.name || 'Sem Time'}</span>
                <h3>${c.nickname}</h3>
                <p class="subtitle">${c.name}</p>
            </div>
        `;
    }).join('');
}

function renderizarConfrontos() {
    const lista = document.getElementById('list-confrontos');
    lista.innerHTML = state.confrontos.map(c => {
        const jogo = state.jogos.find(j => j.id == c.gameId);
        const time1 = state.times.find(t => t.id == c.team1Id);
        const time2 = state.times.find(t => t.id == c.team2Id);
        const data = new Date(c.date).toLocaleString('pt-BR');

        return `
            <div class="card">
                <span class="card-tag">${jogo?.name || 'Jogo'} | ${data}</span>
                <div class="match-card">
                    <div class="team-score">
                        <strong>${time1?.name || '???'}</strong>
                        <div class="score">${c.score1}</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team-score">
                        <strong>${time2?.name || '???'}</strong>
                        <div class="score">${c.score2}</div>
                    </div>
                </div>
                <div style="margin-top: 1rem; text-align: center;">
                    <span class="card-tag" style="background: ${c.status === 'finished' ? '#10b981' : '#f59e0b'}">
                        ${c.status === 'finished' ? 'FINALIZADO' : 'AGENDADO'}
                    </span>
                    ${c.status === 'scheduled'
                        ? `<button onclick="encerrarConfrontos(${c.id})" style="padding: 4px 8px; font-size: 0.7rem; margin-left: 8px;">Finalizar</button>`
                        : ''}
                </div>
            </div>
        `;
    }).join('');
}

// --- Modal e formulários ---

const modal = document.getElementById('modal-container');
const formContent = document.getElementById('form-content');

window.abrirFormulario = function (tipo) {
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'all';
    }, 10);

    const optionsTimes = state.times.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    const optionsJogos = state.jogos.map(j => `<option value="${j.id}">${j.name}</option>`).join('');

    const formularios = {
        jogo: `
            <h2>Adicionar Jogo</h2>
            <form onsubmit="salvarItem(event, 'jogos')">
                <div class="form-group">
                    <label>Nome do Jogo</label>
                    <input type="text" name="name" required placeholder="Ex: CS2">
                </div>
                <div class="form-group">
                    <label>Gênero</label>
                    <input type="text" name="genre" required placeholder="Ex: FPS">
                </div>
                <div style="display:flex; gap: 1rem;">
                    <button type="submit" class="btn-primary">Salvar</button>
                    <button type="button" onclick="fecharModal()">Cancelar</button>
                </div>
            </form>
        `,
        time: `
            <h2>Adicionar Time</h2>
            <form onsubmit="salvarItem(event, 'times')">
                <div class="form-group">
                    <label>Nome da Equipe</label>
                    <input type="text" name="name" required placeholder="Ex: Ninjas da Noite">
                </div>
                <div class="form-group">
                    <label>Cor Identidade</label>
                    <input type="color" name="color" value="#6366f1">
                </div>
                <div style="display:flex; gap: 1rem;">
                    <button type="submit" class="btn-primary">Criar</button>
                    <button type="button" onclick="fecharModal()">Cancelar</button>
                </div>
            </form>
        `,
        competidor: `
            <h2>Registrar Competidor</h2>
            <form onsubmit="salvarItem(event, 'competidores')">
                <div class="form-group">
                    <label>Nome Completo</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Nickname</label>
                    <input type="text" name="nickname" required>
                </div>
                <div class="form-group">
                    <label>Time</label>
                    <select name="teamId" required>${optionsTimes}</select>
                </div>
                <div style="display:flex; gap: 1rem;">
                    <button type="submit" class="btn-primary">Registrar</button>
                    <button type="button" onclick="fecharModal()">Cancelar</button>
                </div>
            </form>
        `,
        confronto: `
            <h2>Novo Confronto</h2>
            <form onsubmit="salvarItem(event, 'confrontos')">
                <div class="form-group">
                    <label>Jogo</label>
                    <select name="gameId" required>${optionsJogos}</select>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Time A</label>
                        <select name="team1Id" required>${optionsTimes}</select>
                    </div>
                    <div class="form-group">
                        <label>Time B</label>
                        <select name="team2Id" required>${optionsTimes}</select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Data/Hora</label>
                    <input type="datetime-local" name="date" required value="${new Date().toISOString().slice(0, 16)}">
                </div>
                <input type="hidden" name="score1" value="0">
                <input type="hidden" name="score2" value="0">
                <input type="hidden" name="status" value="scheduled">
                <div style="display:flex; gap: 1rem;">
                    <button type="submit" class="btn-primary">Agendar</button>
                    <button type="button" onclick="fecharModal()">Cancelar</button>
                </div>
            </form>
        `,
    };

    formContent.innerHTML = formularios[tipo] || '';
};

window.fecharModal = function () {
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
};

window.salvarItem = function (event, colecao) {
    event.preventDefault();
    const dados = Object.fromEntries(new FormData(event.target).entries());

    const maxId = state[colecao].reduce((max, item) => (item.id > max ? item.id : max), 0);
    dados.id = maxId + 1;

    if (dados.teamId) dados.teamId = Number(dados.teamId);
    if (dados.gameId) dados.gameId = Number(dados.gameId);
    if (dados.team1Id) dados.team1Id = Number(dados.team1Id);
    if (dados.team2Id) dados.team2Id = Number(dados.team2Id);
    if (dados.score1 !== undefined) dados.score1 = Number(dados.score1);
    if (dados.score2 !== undefined) dados.score2 = Number(dados.score2);

    state[colecao].push(dados);
    renderizarTudo();
    fecharModal();
};

window.encerrarConfrontos = function (id) {
    const confronto = state.confrontos.find(c => c.id == id);
    if (!confronto) return;

    const time1 = state.times.find(t => t.id == confronto.team1Id);
    const time2 = state.times.find(t => t.id == confronto.team2Id);

    const placar1 = prompt(`Placar para ${time1?.name}:`, '0');
    const placar2 = prompt(`Placar para ${time2?.name}:`, '0');

    if (placar1 !== null && placar2 !== null) {
        confronto.score1 = Number(placar1);
        confronto.score2 = Number(placar2);
        confronto.status = 'finished';

        renderizarTudo();
    }
};

/* =========================================
   FOGOS DE ARTIFÍCIO DA ARENA
========================================= */

let canvas;
let ctx;
let particles = [];

function iniciarFogos() {
    canvas = document.getElementById('fireworks');

    if (!canvas) {
        console.warn('Canvas dos fogos não encontrado.');
        return;
    }

    ctx = canvas.getContext('2d');

    ajustarCanvas();

    window.addEventListener('resize', ajustarCanvas);

    animarFogos();
}

function ajustarCanvas() {
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

function criarExplosao(x, y) {

    const quantidade = 70;

    const cores = [
        '#6366f1',
        '#06b6d4',
        '#f43f5e',
        '#facc15',
        '#22c55e',
        '#ffffff'
    ];

    for (let i = 0; i < quantidade; i++) {

        const angulo = Math.random() * Math.PI * 2;
        const velocidade = Math.random() * 5 + 2;

        particles.push({
            x: x,
            y: y,

            vx: Math.cos(angulo) * velocidade,
            vy: Math.sin(angulo) * velocidade,

            vida: 1,

            tamanho: Math.random() * 3 + 1,

            cor: cores[
                Math.floor(Math.random() * cores.length)
            ]
        });
    }
}

function animarFogos() {

    if (!canvas || !ctx) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    for (let i = particles.length - 1; i >= 0; i--) {

        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        p.vy += 0.04;

        p.vida -= 0.015;

        ctx.globalAlpha = Math.max(p.vida, 0);

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.tamanho,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = p.cor;

        ctx.fill();

        if (p.vida <= 0) {
            particles.splice(i, 1);
        }
    }

    ctx.globalAlpha = 1;

    requestAnimationFrame(animarFogos);
}

function lancarFogos() {

    if (!canvas) return;

    const quantidade = 5;

    for (let i = 0; i < quantidade; i++) {

        setTimeout(() => {

            const x =
                Math.random() * canvas.width;

            const y =
                Math.random() * (canvas.height * 0.55);

            criarExplosao(x, y);

        }, i * 450);
    }
}