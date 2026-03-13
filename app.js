// Base App.js logic layout
const App = {
  state: {
    v: 1,
    t: 'My Team',
    p: [],
    lineup: null,
    bench: []
  },

  init() {
    this.parseUrl();
    this.render();
    window.addEventListener('hashchange', () => {
      this.parseUrl();
      this.render();
    });
    this.initSwipeGestures();
  },

  parseUrl() {
    const hash = window.location.hash.substring(1);
    if (!hash) {
      // Default initial state with 6 blank players for mobile-friendly editing
      this.state.lineup = null;
      this.state.bench = [];
      this.state.t = 'My Team';
      this.state.p = [
        { id: 'p1', name: 'Player 1', pos: [], here: true },
        { id: 'p2', name: 'Player 2', pos: [], here: true },
        { id: 'p3', name: 'Player 3', pos: [], here: true },
        { id: 'p4', name: 'Player 4', pos: [], here: true },
        { id: 'p5', name: 'Player 5', pos: [], here: true },
        { id: 'p6', name: 'Player 6', pos: [], here: true }
      ];
      // Sync it immediately so they can refresh
      this.updateUrl();
      return;
    }

    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(hash))));
      this.state = { ...this.state, ...decoded };
    } catch (e) {
      console.error("Invalid URL Hash", e);
      window.location.hash = '';
    }
  },

  updateUrl() {
    const jsonStr = JSON.stringify(this.state);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    window.location.hash = encoded;
  },

  render() {
    const appEl = document.getElementById('app');
    appEl.innerHTML = '';
    if (this.state.lineup) {
      this.renderLineup(appEl);
    } else {
      this.renderRoster(appEl);
    }
  },

  renderRoster(container) {
    const present = this.state.p.filter(p => p.here).length;
    const setters = this.state.p.filter(p => p.here && p.pos.includes('S')).length;
    const middles = this.state.p.filter(p => p.here && p.pos.includes('M')).length;
    const outsides = this.state.p.filter(p => p.here && p.pos.includes('O')).length;
    const hasAnyRoles = this.state.p.some(p => p.here && p.pos.length > 0);

    const warningMsg = this.state.generateError ||
                      (present < 6 ? `You have ${present} players checked in. Need at least 6 to play.` : '');

    let html = `
      <header class="roster-header">
        <h1>Sub In</h1>
        <input type="text" class="team-name-input" value="${this.escapeHtml(this.state.t)}" aria-label="Team name" onchange="App.updateTeamName(this.value)">
      </header>

      <p class="value-prop">Generate a valid 4-2 volleyball rotation for your rec league — free, no signup.</p>

      <div class="status-row" aria-live="polite">
        <span class="${present < 6 ? 'warning-text' : ''}">Present: ${present}</span>
        ${hasAnyRoles ? ` &middot; S: ${setters} &middot; M: ${middles} &middot; O: ${outsides}` : ''}
      </div>

      ${warningMsg ? `<div class="warning-banner" role="alert">${warningMsg}</div>` : ''}

      <ul class="player-list">
        ${this.state.p.map((p, i) => this.renderPlayerRow(p, i + 1)).join('')}
      </ul>

      <div class="add-player-row">
        <input type="text" id="new-player-name" placeholder="Add player..." onkeypress="if(event.key === 'Enter') App.addPlayer()">
        <button onclick="App.addPlayer()" aria-label="Add player">Add</button>
      </div>

      <button class="cta-button" onclick="App.generateLineup()">
        Generate lineup &rarr;
      </button>

      ${this.state.p.length === 0 ? `<button class="demo-button" onclick="App.loadDemo()">Load demo</button>` : ''}

      <div class="how-it-works">
        <h2>How it works</h2>
        <ol>
          <li>Enter your players and check who&rsquo;s present today</li>
          <li>Tag positions: <strong>S</strong> = Setter, <strong>M</strong> = Middle, <strong>O</strong> = Outside. Players with no tag can play anywhere.</li>
          <li>Tap <strong>Generate lineup</strong> to get a valid 4-2 rotation</li>
          <li>Rotate through all 6 positions and share with your team</li>
        </ol>
        <a href="learn.html" class="learn-link">Learn about 4-2 rotations &rarr;</a>
      </div>
    `;

    container.innerHTML = html;
  },

  renderPlayerRow(p, num) {
    const isPrimaryS = p.pos[0] === 'S';
    const isPrimaryM = p.pos[0] === 'M';
    const isPrimaryO = p.pos[0] === 'O';
    const placeholder = `P${num}`;

    return `
      <li class="player-row">
        <button class="check-toggle ${p.here ? 'checked' : ''}"
                onclick="App.toggleHere('${p.id}')"
                aria-label="${p.name || placeholder} is here"
                role="switch"
                aria-checked="${p.here}"></button>
        <input type="text" class="player-name-input" value="${this.escapeHtml(p.name)}"
               placeholder="${placeholder}"
               aria-label="Edit name for ${this.escapeHtml(p.name || placeholder)}"
               onchange="App.updatePlayerName('${p.id}', this.value)" />

        <div class="pos-toggles">
          <button class="pos-toggle ${p.pos.includes('S') ? 'active' : ''} ${isPrimaryS ? 'primary' : ''}"
                  onclick="App.togglePos('${p.id}', 'S')"
                  role="checkbox"
                  aria-checked="${p.pos.includes('S')}">S</button>
          <button class="pos-toggle ${p.pos.includes('M') ? 'active' : ''} ${isPrimaryM ? 'primary' : ''}"
                  onclick="App.togglePos('${p.id}', 'M')"
                  role="checkbox"
                  aria-checked="${p.pos.includes('M')}">M</button>
          <button class="pos-toggle ${p.pos.includes('O') ? 'active' : ''} ${isPrimaryO ? 'primary' : ''}"
                  onclick="App.togglePos('${p.id}', 'O')"
                  role="checkbox"
                  aria-checked="${p.pos.includes('O')}">O</button>
        </div>

        <button class="remove-btn" onclick="App.removePlayer('${p.id}')" aria-label="Remove ${this.escapeHtml(p.name)}">&times;</button>
      </li>
    `;
  },

  escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  },

  updateTeamName(val) {
    this.state.t = val;
    this.updateUrl();
  },

  updatePlayerName(id, val) {
    const p = this.state.p.find(player => player.id === id);
    if (p) {
      p.name = val.trim(); // Allow empty; display fallback is handled per-context
      this.updateUrl();
      // We don't re-render immediately to prevent losing focus if they are tabbing through
      // The DOM is already updated since it's an input field.
      // But if we want to ensure state matches (like ARIA labels), we might need to.
      // Let's just update the URL for now.
    }
  },

  toggleHere(id) {
    this.haptic('light');
    const p = this.state.p.find(player => player.id === id);
    if (p) p.here = !p.here;
    this.state.generateError = null;
    this.updateUrl();
    this.render();
  },

  togglePos(id, pos) {
    this.haptic('light');
    const p = this.state.p.find(player => player.id === id);
    if (!p) return;
    const idx = p.pos.indexOf(pos);
    if (idx > -1) {
      p.pos.splice(idx, 1);
    } else {
      p.pos.push(pos);
    }
    this.state.generateError = null;
    this.updateUrl();
    this.render();
  },

  addPlayer() {
    const input = document.getElementById('new-player-name');
    const name = input.value.trim();
    if (!name) return;

    const id = 'p' + Math.random().toString(36).substr(2, 9);
    this.state.p.push({ id, name, pos: [], here: true });

    this.updateUrl();
    this.render();

    // Maintain focus on input
    setTimeout(() => {
      const newInput = document.getElementById('new-player-name');
      if (newInput) newInput.focus();
    }, 0);
  },

  removePlayer(id) {
    this.haptic('light');
    this.state.p = this.state.p.filter(p => p.id !== id);
    this.state.generateError = null;
    this.updateUrl();
    this.render();
  },

  loadDemo() {
    this.state.p = [
      { id: "p1", name: "Peter", pos: ["S", "O"], here: true },
      { id: "p2", name: "Apurva", pos: ["S", "O", "M"], here: true },
      { id: "p3", name: "Tommy", pos: ["S"], here: true },
      { id: "p4", name: "Saif", pos: ["M"], here: true },
      { id: "p5", name: "Kyle", pos: ["S"], here: true },
      { id: "p6", name: "DAngelo", pos: ["O", "M"], here: true },
      { id: "p7", name: "Nikola", pos: ["M"], here: false },
      { id: "p8", name: "Chris", pos: ["O"], here: true },
      { id: "p9", name: "JP", pos: ["M"], here: true },
      { id: "p10", name: "Matt", pos: ["S"], here: false }
    ];
    this.updateUrl();
    this.render();
  },

  generateLineup() {
    this.state.generateError = null;
    const result = Solver.solve(this.state.p);
    if (result.error) {
      this.haptic('error');
      this.state.generateError = result.error;
      this.render();
      return;
    }
    this.haptic('success');

    // Choose the best proposal
    const best = result.proposals[0];
    this.state.lineup = best.lineup;
    this.state.bench = best.bench;

    this.state.proposals = result.proposals;
    this.state.selectedProposalIndex = 0;
    this.state.rotationCount = 0;
    this.state.viewMode = 'serve';
    this.state.selectedPos = null;
    this.state.lineupHistory = [{ lineup: { ...best.lineup }, bench: [...best.bench] }];
    this.state.historyIndex = 0;

    this.updateUrl();
    this.render();
  },

  backToRoster() {
    this.state.lineup = null;
    this.state.bench = [];
    this.updateUrl();
    this.render();
  },

  getPosRole(p) {
    if (p == 4 || p == 1) return 'S';
    if (p == 3 || p == 6) return 'M';
    if (p == 2 || p == 5) return 'O';
    return '';
  },

  getRoleName(r) {
    if (r === 'S') return 'Setter';
    if (r === 'M') return 'Middle';
    if (r === 'O') return 'Outside';
    return '';
  },

  getPlayerFit(player, requiredRole) {
    const idx = player.pos.indexOf(requiredRole);
    if (idx === 0) return { text: 'Primary', class: 'fit-primary' };
    if (idx === 1) return { text: 'Flex', class: 'fit-flex' };
    if (idx > 1) return { text: 'Stretch', class: 'fit-stretch' };
    return { text: 'Unknown', class: '' }; // Cannot
  },

  // ── Court cell (replaces old renderCourtToken) ────────────────────────────
  renderCourtCell(posNum, isReadOnly, viewMode) {
    const playerId = this.state.lineup[posNum];
    const player = this.state.p.find(p => p.id === playerId);
    if (!player) return `<div class="court-cell" data-pos="${posNum}"></div>`;

    const playerIndex = this.state.p.findIndex(x => x.id === playerId) + 1;
    const rawName = player.name && player.name.trim() ? player.name : `P${playerIndex}`;
    const shortName = Share.formatName(rawName, this.state.p);
    const role = this.getPosRole(posNum);
    const isServing = posNum == 1;
    const isSelected = this.state.selectedPos === posNum;
    const inPlayNote = viewMode === 'play' ? this.getInPlayNote(role, posNum) : '';

    const tokenClasses = [
      'court-token',
      `role-${role}`,
      isServing ? 'is-serving' : '',
      isSelected ? 'selected' : ''
    ].filter(Boolean).join(' ');

    const dragAttrs = !isReadOnly
      ? `draggable="true" ondragstart="App.dragStart(${posNum})" ondragend="App.dragEnd()"`
      : '';
    const cellAttrs = !isReadOnly
      ? `ondragover="event.preventDefault()" ondrop="App.dropOnPos(${posNum})" ondragenter="this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')"`
      : '';

    return `
      <div class="court-cell" data-pos="${posNum}" ${cellAttrs}>
        <div class="pos-number">P${posNum}</div>
        <div class="${tokenClasses}"
             id="pos-${posNum}"
             ${dragAttrs}
             ${!isReadOnly ? `onclick="App.selectPos(${posNum})"` : ''}
             role="button" tabindex="0"
             aria-label="${this.escapeHtml(shortName)}, ${this.getRoleName(role)}${isServing ? ', serving' : ''}${isSelected ? ', selected to swap' : ''}">
          <div class="token-avatar">${role}</div>
          ${isServing ? `<span class="token-mic-icon">🎤</span>` : ''}
        </div>
        <div class="token-name-label ${isServing ? 'serving' : ''}">${this.escapeHtml(shortName)}</div>
        ${inPlayNote ? `<div class="token-action-note">${inPlayNote}</div>` : ''}
      </div>
    `;
  },

  // ── Lineup screen ──────────────────────────────────────────────────────────
  renderLineup(container) {
    const isReadOnly = this.state.isSharedView;
    const viewMode = this.state.viewMode || 'serve';
    const history = this.state.lineupHistory || [];
    const canUndo = (this.state.historyIndex || 0) > 0;
    const canRedo = (this.state.historyIndex || 0) < history.length - 1;

    const rotationCount = this.state.rotationCount || 0;
    const serveNum = ((rotationCount % 6) + 6) % 6 + 1;

    const p1Id = this.state.lineup[1];
    const p1 = this.state.p.find(p => p.id === p1Id);
    const p1Idx = this.state.p.findIndex(p => p.id === p1Id) + 1;
    const serverName = p1 ? (p1.name?.trim() || `P${p1Idx}`) : '';

    const ariaLabel = [4,3,2,5,6,1].map(posNum => {
      const id = this.state.lineup[posNum];
      const pl = this.state.p.find(p => p.id === id);
      if (!pl) return '';
      const idx = this.state.p.findIndex(p => p.id === id) + 1;
      const n = pl.name?.trim() || `P${idx}`;
      return `${n}: ${this.getRoleName(this.getPosRole(posNum))}`;
    }).filter(Boolean).join(', ');

    const benchHtml = (this.state.bench || []).map(id => {
      const p = this.state.p.find(x => x.id === id);
      if (!p) return '';
      const idx = this.state.p.findIndex(x => x.id === id) + 1;
      return this.escapeHtml(p.name?.trim() || `P${idx}`);
    }).filter(Boolean).join(' &middot; ') || 'None';

    let html = `
      <header class="lineup-header">
        ${!isReadOnly ? `<button onclick="App.backToRoster()" class="back-btn" aria-label="Back to roster">&larr; Back</button>` : ''}
        <h1>${this.escapeHtml(this.state.t)}</h1>
        ${!isReadOnly ? `
          <div class="undo-redo" role="group" aria-label="Undo / Redo">
            <button onclick="App.undoLineup()" ${!canUndo ? 'disabled' : ''} aria-label="Undo" title="Undo swap">↩</button>
            <button onclick="App.redoLineup()" ${!canRedo ? 'disabled' : ''} aria-label="Redo" title="Redo swap">↪</button>
          </div>
        ` : ''}
      </header>

      ${!isReadOnly ? `
        <div class="mode-toggle" role="group" aria-label="View mode">
          <button class="${viewMode === 'serve' ? 'active' : ''}" onclick="App.setViewMode('serve')">Before Serve</button>
          <button class="${viewMode === 'play' ? 'active' : ''}" onclick="App.setViewMode('play')">Ball in Play</button>
        </div>
      ` : ''}

      <div class="serve-indicator-wrap" aria-live="polite">
        <div class="serve-indicator">
          <span class="serve-mic">🎤</span>
          <span class="serve-name">${this.escapeHtml(serverName)}</span>
          <span class="serve-meta">serves</span>
          <span class="rotation-badge">${serveNum} <span class="rotation-of">/ 6</span></span>
        </div>
      </div>

      <div class="court-and-bench">
        <div class="court-container ${viewMode}-mode" role="img" aria-label="${ariaLabel}">
          <div class="net-bar"></div>
          <div class="court-row">
            ${[4,3,2].map(posNum => this.renderCourtCell(posNum, isReadOnly, viewMode)).join('')}
          </div>
          <div class="attack-line"></div>
          <div class="court-row">
            ${[5,6,1].map(posNum => this.renderCourtCell(posNum, isReadOnly, viewMode)).join('')}
          </div>
        </div>
        ${!isReadOnly ? this.renderBenchSidebar() : ''}
      </div>

      ${isReadOnly ? `<div class="bench-row"><strong>Bench:</strong> ${benchHtml}</div>` : ''}

      ${!isReadOnly ? `
        <div class="rotation-controls">
          <button onclick="App.simulateRotation(-1)" aria-label="Undo rotation">← Undo</button>
          <button onclick="App.simulateRotation(1)" aria-label="Rotate clockwise">Rotate →</button>
        </div>
      ` : ''}

      ${!isReadOnly ? `
        <table class="fit-table">
          <thead><tr>
            <th scope="col">Position</th>
            <th scope="col">Player</th>
            <th scope="col">Fit</th>
          </tr></thead>
          <tbody>
            ${[4,3,2,5,6,1].map(posNum => {
              const playerId = this.state.lineup[posNum];
              const player = this.state.p.find(p => p.id === playerId);
              if (!player) return '';
              const requiredRole = this.getPosRole(posNum);
              const fit = this.getPlayerFit(player, requiredRole);
              const pidx = this.state.p.findIndex(x => x.id === playerId) + 1;
              const name = player.name?.trim() || `P${pidx}`;
              return `<tr>
                <td>${this.getRoleName(requiredRole)} (P${posNum})</td>
                <td>${this.escapeHtml(name)}</td>
                <td class="${fit.class}">${fit.text}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        ${this.state.proposals && this.state.proposals.length > 1 ? `
          <section class="suggestions-section">
            <h2>Lineup Options</h2>
            <div class="suggestion-cards">
              ${this.state.proposals.map((prop, i) => this.renderSuggestionCard(prop, i)).join('')}
            </div>
          </section>
        ` : ''}

        <div class="share-bar">
          <button onclick="App.shareImage()">Save image</button>
          <button onclick="App.copyText(this)">Copy text</button>
          <button onclick="App.copyLink(this)">Copy link</button>
        </div>
      ` : `
        <div class="acquisition-hook">
          <a href="https://subin.app">Build your own lineup &rarr; subin.app</a>
        </div>
      `}
    `;

    container.innerHTML = html;
  },

  selectProposal(index) {
    if (this.state.proposals && this.state.proposals[index]) {
      const prop = this.state.proposals[index];
      this.pushHistory();
      this.state.lineup = { ...prop.lineup };
      this.state.bench = [...prop.bench];
      this.state.selectedProposalIndex = index;
      this.state.rotationCount = 0;
      this.updateUrl();
      this.render();
    }
  },

  // ── Haptics ────────────────────────────────────────────────────────────────
  haptic(type = 'light') {
    if (!('vibrate' in navigator)) return;
    const p = { light:[8], select:[12], swap:[15,8,15], rotate:[10,25,10], error:[40,20,40], success:[10,40,10] };
    navigator.vibrate(p[type] ?? [8]);
  },

  // ── Bench sidebar (shows beside court) ─────────────────────────────────────
  renderBenchSidebar() {
    const bench = this.state.bench || [];
    if (bench.length === 0) {
      return `<div class="bench-sidebar"><span class="bench-label">Bench</span><span class="bench-empty">—</span></div>`;
    }
    const tokens = bench.map(id => {
      const p = this.state.p.find(x => x.id === id);
      if (!p) return '';
      const idx = this.state.p.findIndex(x => x.id === id) + 1;
      const name = p.name?.trim() || `P${idx}`;
      const short = Share.formatName(name, this.state.p);
      const role = p.pos[0] || '';
      return `
        <div class="bench-token">
          <div class="bench-avatar${role ? ` role-${role}` : ''}">${role || short[0]?.toUpperCase() || '?'}</div>
          <div class="bench-name">${this.escapeHtml(short)}</div>
        </div>`;
    }).join('');
    return `
      <div class="bench-sidebar">
        <span class="bench-label">Bench</span>
        ${tokens}
      </div>`;
  },

  // ── History ────────────────────────────────────────────────────────────────
  pushHistory() {
    const history = this.state.lineupHistory || [];
    const idx = this.state.historyIndex !== undefined ? this.state.historyIndex : history.length - 1;
    const trimmed = history.slice(0, idx + 1);
    trimmed.push({ lineup: { ...this.state.lineup }, bench: [...(this.state.bench || [])] });
    this.state.lineupHistory = trimmed;
    this.state.historyIndex = trimmed.length - 1;
  },

  undoLineup() {
    const history = this.state.lineupHistory || [];
    if ((this.state.historyIndex || 0) > 0) {
      this.haptic('light');
      this.state.historyIndex--;
      const snap = history[this.state.historyIndex];
      this.state.lineup = { ...snap.lineup };
      this.state.bench = [...snap.bench];
      this.state.selectedPos = null;
      this.updateUrl();
      this.render();
    }
  },

  redoLineup() {
    const history = this.state.lineupHistory || [];
    const idx = this.state.historyIndex || 0;
    if (idx < history.length - 1) {
      this.haptic('light');
      this.state.historyIndex++;
      const snap = history[this.state.historyIndex];
      this.state.lineup = { ...snap.lineup };
      this.state.bench = [...snap.bench];
      this.state.selectedPos = null;
      this.updateUrl();
      this.render();
    }
  },

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  dragStart(posNum) {
    this.state.dragFrom = posNum;
    this.state.selectedPos = null; // clear tap-select when dragging
    setTimeout(() => {
      const el = document.getElementById(`pos-${posNum}`);
      if (el) el.classList.add('dragging');
    }, 0);
  },

  dragEnd() {
    document.querySelectorAll('.court-token.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.court-cell.drag-over').forEach(el => el.classList.remove('drag-over'));
  },

  dropOnPos(targetPos) {
    document.querySelectorAll('.court-cell.drag-over').forEach(el => el.classList.remove('drag-over'));
    const from = this.state.dragFrom;
    this.state.dragFrom = null;
    if (from === null || from === undefined || from === targetPos) return;
    this.haptic('swap');
    this.pushHistory();
    const tmp = this.state.lineup[targetPos];
    this.state.lineup[targetPos] = this.state.lineup[from];
    this.state.lineup[from] = tmp;
    this.updateUrl();
    this.render();
  },

  // ── Tap-to-swap (mobile-friendly alternative to drag) ─────────────────────
  selectPos(posNum) {
    const prev = this.state.selectedPos;
    if (prev === posNum) {
      // Deselect
      this.haptic('light');
      this.state.selectedPos = null;
      this.render();
      return;
    }
    if (prev !== null && prev !== undefined) {
      // Swap prev ↔ posNum
      this.haptic('swap');
      this.pushHistory();
      const tmp = this.state.lineup[posNum];
      this.state.lineup[posNum] = this.state.lineup[prev];
      this.state.lineup[prev] = tmp;
      this.state.selectedPos = null;
      this.updateUrl();
      this.render();
      this.showToast('Swapped!');
    } else {
      // First tap — select
      this.haptic('select');
      this.state.selectedPos = posNum;
      // Highlight via class without full re-render for snappiness
      document.querySelectorAll('.court-token.selected').forEach(el => el.classList.remove('selected'));
      const el = document.getElementById(`pos-${posNum}`);
      if (el) el.classList.add('selected');
    }
  },

  // ── View mode (Before Serve / Ball in Play) ────────────────────────────────
  setViewMode(mode) {
    this.state.viewMode = mode;
    this.state.selectedPos = null;
    this.render();
  },

  // ── In-play movement annotations ───────────────────────────────────────────
  getInPlayNote(role, posNum) {
    const isBack = posNum === 1 || posNum === 5 || posNum === 6;
    if (role === 'S') return isBack ? 'Run RF ↗' : 'Set →';
    if (role === 'M') return isBack ? 'Dig tips' : 'Block + Swing';
    if (role === 'O') return isBack ? 'Pass line' : 'Attack LF';
    return '';
  },

  // ── Star ratings for suggestions ──────────────────────────────────────────
  getStars(score) {
    const filled = Math.max(1, Math.round((score / 18) * 5));
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  },

  renderSuggestionCard(proposal, index) {
    const isActive = index === (this.state.selectedProposalIndex || 0);
    const stars = this.getStars(proposal.score);
    const setterNames = [proposal.lineup[4], proposal.lineup[1]].map(id => {
      const p = this.state.p.find(x => x.id === id);
      if (!p) return '';
      const idx = this.state.p.findIndex(x => x.id === id) + 1;
      return p.name?.trim() || `P${idx}`;
    }).filter(Boolean);
    const label = index === 0 ? 'Best fit' : `Option ${index + 1}`;
    return `
      <div class="suggestion-card ${isActive ? 'active' : ''}"
           onclick="App.selectProposal(${index})" role="button" tabindex="0"
           aria-pressed="${isActive}">
        <div class="suggestion-stars">${stars}</div>
        <div class="suggestion-info">
          <div class="suggestion-label">${label}</div>
          <div class="suggestion-detail">Setters: ${setterNames.map(n => this.escapeHtml(n)).join(' &amp; ')}</div>
        </div>
      </div>
    `;
  },

  simulateRotation(direction) {
    // direction = 1 for clockwise (rotate), -1 for counter-clockwise (undo)
    // 4->3, 3->2, 2->1, 1->6, 6->5, 5->4
    this.haptic('rotate');
    this.pushHistory();
    this.state.rotationCount = (this.state.rotationCount || 0) + direction;

    const oldLineup = { ...this.state.lineup };
    const newLineup = {};
    if (direction === 1) {
      newLineup[3] = oldLineup[4];
      newLineup[2] = oldLineup[3];
      newLineup[1] = oldLineup[2];
      newLineup[6] = oldLineup[1];
      newLineup[5] = oldLineup[6];
      newLineup[4] = oldLineup[5];
    } else {
      newLineup[4] = oldLineup[3];
      newLineup[3] = oldLineup[2];
      newLineup[2] = oldLineup[1];
      newLineup[1] = oldLineup[6];
      newLineup[6] = oldLineup[5];
      newLineup[5] = oldLineup[4];
    }

    // Animate tokens if not prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      // Find dom nodes
      const tokens = {};
      [1,2,3,4,5,6].forEach(pos => {
        tokens[pos] = document.getElementById(`pos-${pos}`);
      });

      // Calculate translations for clockwise
      // Layout is grid:
      // P4 P3 P2
      // P5 P6 P1
      // Actually we just set opacity to 0, render, and opacity back to 1 for a simple crossfade,
      // or we just render immediately since PRD says "animates tokens clockwise, 300ms".
      // Let's rely on standard re-render but add a small CSS animation class if possible.
      // Easiest is to add a global class to the court container, re-render, and CSS handles it.
      // But DOM is replaced. Let's just re-render and rely on standard snappy update,
      // as exact coordinate animation requires absolute positioning which breaks responsive grid.
      // To satisfy "Animates tokens clockwise, 300ms", we can do a quick opacity fade.
      const court = document.querySelector('.court-container');
      if (court) {
        court.style.transition = 'opacity 150ms';
        court.style.opacity = '0';
        setTimeout(() => {
          this.state.lineup = newLineup;
          this.updateUrl();
          this.render();

          // Show toast for new server
          const newServerId = this.state.lineup[1];
          const newServer = this.state.p.find(p => p.id === newServerId);
          if (newServer) {
            this.showToast(`${Share.formatName(newServer.name)} now serves.`);
          }

          const newCourt = document.querySelector('.court-container');
          if (newCourt) {
            newCourt.style.opacity = '0';
            requestAnimationFrame(() => {
              newCourt.style.transition = 'opacity 150ms';
              newCourt.style.opacity = '1';
              // Trigger slide-in animation for new server position
              if (direction === 1) {
                const cell1 = document.querySelector('.court-cell[data-pos="1"]');
                if (cell1) {
                  cell1.classList.add('just-rotated');
                  setTimeout(() => cell1.classList.remove('just-rotated'), 500);
                }
              }
            });
          }
        }, 150);
        return;
      }
    }

    this.state.lineup = newLineup;
    this.updateUrl();
    this.render();

    // Show toast for new server
    const newServerId = this.state.lineup[1];
    const newServer = this.state.p.find(p => p.id === newServerId);
    if (newServer) {
      const sIdx = this.state.p.findIndex(p => p.id === newServerId) + 1;
      const sName = newServer.name?.trim() || `P${sIdx}`;
      this.showToast(`${Share.formatName(sName)} now serves.`);
    }
  },

  initSwipeGestures() {
    let touchstartX = 0;
    let touchendX = 0;

    document.addEventListener('touchstart', e => {
      touchstartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', e => {
      touchendX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });

    this.handleSwipe = () => {
      if (!this.state.lineup || this.state.isSharedView) return;
      const court = document.querySelector('.court-container');
      if (!court) return; // Only active when court is visible

      const swipeDistance = touchendX - touchstartX;
      if (swipeDistance > 40) {
        // Swipe right -> clockwise rotation
        this.simulateRotation(1);
      } else if (swipeDistance < -40) {
        // Swipe left -> counter-clockwise
        this.simulateRotation(-1);
      }
    };
  },

  showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  },

  showRoleInfo(role, pNum) {
    // Role descriptions from PRD
    let desc = '';
    if (role === 'S' && pNum === 4) desc = "You're setting. Move to the right side after the serve. Put the ball where your hitters can swing.";
    else if (role === 'S' && pNum === 1) desc = "You're serving first. Stay back, dig, support your setter up front.";
    else if (role === 'O' && pNum === 2) desc = "Attack from the left antenna. Swing when the setter finds you.";
    else if (role === 'O' && pNum === 5) desc = "Pass the serve cleanly. Cover the line on defense.";
    else if (role === 'M' && pNum === 3) desc = "Jump with the opponent's hitter and close the block. Quick attack when you get a set.";
    else if (role === 'M' && pNum === 6) desc = "Cover tips and short balls over the middle.";
    else desc = "Role info not found.";

    alert(desc); // Minimal bottom sheet fallback for now
  },

  async shareImage() {
    await Share.shareImage(this.state.t, this.state.p, this.state.lineup, this.state.bench);
  },

  async copyText(btn) {
    const text = Share.generateEmojiText(this.state.t, this.state.p, this.state.lineup, this.state.bench, window.location.hash.substring(1));
    const success = await Share.copyText(text);
    if (success) {
      const original = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = original, 2000);
    }
  },

  async copyLink(btn) {
    const success = await Share.copyText(window.location.href);
    if (success) {
      const original = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = original, 2000);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Check if initial load is a shared view
  const hash = window.location.hash.substring(1);
  if (hash) {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(hash))));
      if (decoded.lineup) {
        App.state.isSharedView = true;

        // Inject SEO meta tags for shared lineup
        const p1Id = decoded.lineup['1'];
        const p4Id = decoded.lineup['4'];
        const p1 = decoded.p.find(x => x.id === p1Id);
        const p4 = decoded.p.find(x => x.id === p4Id);

        if (p1 && p4) {
          const s1 = Share.formatName(p1.name);
          const s2 = Share.formatName(p4.name);
          const team = decoded.t || 'Team';

          document.title = `${team} · 4-2 Rotation — Sub In`;

          const setMeta = (name, content, attr='name') => {
            let tag = document.querySelector(`meta[${attr}="${name}"]`);
            if (tag) tag.setAttribute('content', content);
          };

          setMeta('description', `${s1} and ${s2} setting. Tap to see the full lineup.`);
          setMeta('og:title', `${team} · 4-2 Rotation`, 'property');
          setMeta('og:description', `${s1} and ${s2} setting · Built with Sub In`, 'property');
        }
      }
    } catch (e) {}
  }
  App.init();
});
