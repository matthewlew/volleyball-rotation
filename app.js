// Base App.js logic layout
const App = {
  state: {
    v: 1,
    t: 'The Rebels',
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
      this.state.lineup = null;
      this.state.bench = [];
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
    const hasError = present < 6 || setters < 2;

    let solverResult = null;
    if (!hasError) {
      solverResult = Solver.solve(this.state.p);
    }

    const errorMsg = solverResult && solverResult.error ? solverResult.error :
                    (present < 6 ? `You have ${present} players checked in. Need at least 6 to play.` :
                    (setters < 2 ? `4-2 needs 2 setters. Only ${this.state.p.filter(p=>p.here&&p.pos.includes("S")).map(p=>p.name).join(', ') || 'nobody'} can set — does anyone else want to flex?` : ''));

    let html = `
      <header class="roster-header">
        <h1>Sub In</h1>
        <input type="text" class="team-name-input" value="${this.escapeHtml(this.state.t)}" aria-label="Team name" onchange="App.updateTeamName(this.value)">
      </header>

      <div class="status-row" aria-live="polite">
        <span class="${present < 6 ? 'warning-text' : ''}">Present: ${present}</span> /
        <span class="${setters < 2 ? 'warning-text' : ''}">Setters: ${setters}</span>
      </div>

      ${errorMsg ? `<div class="warning-banner" role="alert">${errorMsg}</div>` : ''}

      <ul class="player-list">
        ${this.state.p.map(p => this.renderPlayerRow(p)).join('')}
      </ul>

      <div class="add-player-row">
        <input type="text" id="new-player-name" placeholder="Add player..." onkeypress="if(event.key === 'Enter') App.addPlayer()">
        <button onclick="App.addPlayer()" aria-label="Add player">Add</button>
      </div>

      <button class="cta-button" onclick="App.generateLineup()" ${errorMsg ? 'aria-disabled="true" disabled' : ''}>
        Generate lineup &rarr;
      </button>
      <p class="micro-copy">Valid 4-2 &middot; no ads &middot; free forever</p>

      ${this.state.p.length === 0 ? `<button class="demo-button" onclick="App.loadDemo()">Load demo</button>` : ''}
    `;

    container.innerHTML = html;
  },

  renderPlayerRow(p) {
    const isPrimaryS = p.pos[0] === 'S';
    const isPrimaryM = p.pos[0] === 'M';
    const isPrimaryO = p.pos[0] === 'O';

    return `
      <li class="player-row">
        <button class="check-toggle ${p.here ? 'checked' : ''}"
                onclick="App.toggleHere('${p.id}')"
                aria-label="${p.name} is here"
                role="switch"
                aria-checked="${p.here}"></button>
        <span class="player-name">${this.escapeHtml(p.name)}</span>

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

  toggleHere(id) {
    const p = this.state.p.find(player => player.id === id);
    if (p) p.here = !p.here;
    this.updateUrl();
    this.render();
  },

  togglePos(id, pos) {
    const p = this.state.p.find(player => player.id === id);
    if (!p) return;
    const idx = p.pos.indexOf(pos);
    if (idx > -1) {
      p.pos.splice(idx, 1);
    } else {
      p.pos.push(pos);
    }
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
    this.state.p = this.state.p.filter(p => p.id !== id);
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
    const result = Solver.solve(this.state.p);
    if (result.error) return; // shouldn't happen due to disabled state

    // Choose the best proposal
    const best = result.proposals[0];
    this.state.lineup = best.lineup;
    this.state.bench = best.bench;

    // Could store all proposals if we wanted tabs, but PRD says "Option tabs ... shown only if multiple proposals exist."
    this.state.proposals = result.proposals;
    this.state.selectedProposalIndex = 0;

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

  renderCourtToken(pNum, isReadOnly) {
    const playerId = this.state.lineup[pNum];
    const player = this.state.p.find(p => p.id === playerId);
    if (!player) return '';

    const name = Share.formatName(player.name, this.state.p);
    const role = this.getPosRole(pNum);
    const isServing = pNum == 1;

    // To support touch animations, we might want to attach an id to the token
    return `
      <div class="court-token role-${role}" id="pos-${pNum}"
           ${isReadOnly ? '' : `onclick="App.showRoleInfo('${role}', ${pNum})"`}
           role="button" aria-label="${name}, ${this.getRoleName(role)}${isServing ? ' (serving)' : ''}">
        <div class="token-name">${this.escapeHtml(name)}</div>
        <div class="token-role">${role}</div>
        ${isServing ? `<div class="token-mic">🎤</div>` : ''}
        ${!isReadOnly ? `<button class="token-info-btn" aria-label="Role info" onclick="event.stopPropagation(); App.showRoleInfo('${role}', ${pNum})">ⓘ</button>` : ''}
      </div>
    `;
  },

  renderLineup(container) {
    // Is read only if there's no editing capabilities (i.e. just a URL shared)
    // We can assume if they don't have local state changes or it's a fresh load with just lineup
    // Actually PRD says: "Screen 3: Read-Only Lineup (shared URL)"
    // The way to check if it's a shared URL might be if they haven't modified it?
    // Or if `p` array has exactly 6 players and we don't know the full roster?
    // Wait, the shared URL has the full `p` array.
    // Let's implement full view and read-only based on PRD: "Roster URL (no lineup key) ... Lineup URL (with lineup + bench): shared to WhatsApp, opens read-only court view."
    // If we land on a URL WITH a lineup key on fresh load, it's read-only.
    // If we clicked "Generate", it's interactive (has Back button).
    // Let's assume for now `this.state.isReadOnly` could be set, or we just render the "Back" button always which brings them to the Roster screen.
    // PRD: "Screen 2: Lineup ... Header: Back button → returns to player screen without losing state."
    // PRD: "Screen 3: Read-Only Lineup (shared URL) ... Same court diagram as Screen 2, no editing controls. Bottom of page — acquisition hook: Build your own lineup → subin.app"
    // Let's add a flag in state `isSharedView` which we set to true if `init()` finds `lineup` in the hash on first load.

    const isReadOnly = this.state.isSharedView;

    let ariaLabelArray = [];
    const p4 = this.state.p.find(p => p.id === this.state.lineup[4]);
    const p3 = this.state.p.find(p => p.id === this.state.lineup[3]);
    const p2 = this.state.p.find(p => p.id === this.state.lineup[2]);
    const p5 = this.state.p.find(p => p.id === this.state.lineup[5]);
    const p6 = this.state.p.find(p => p.id === this.state.lineup[6]);
    const p1 = this.state.p.find(p => p.id === this.state.lineup[1]);

    const formatAria = (p, role) => p ? `${Share.formatName(p.name, this.state.p)} ${this.getRoleName(role)}` : '';
    const ariaLabel = `Front row: ${formatAria(p4, 'S')}, ${formatAria(p3, 'M')}, ${formatAria(p2, 'O')}. Back row: ${formatAria(p5, 'O')}, ${formatAria(p6, 'M')}, ${formatAria(p1, 'S')} serving.`;

    const activeIndex = this.state.selectedProposalIndex || 0;

    let html = `
      <header class="lineup-header">
        ${!isReadOnly ? `<button onclick="App.backToRoster()" aria-label="Back to roster" class="back-btn">&larr; Back</button>` : ''}
        <h1>${this.escapeHtml(this.state.t)}</h1>
      </header>

      ${this.state.proposals && this.state.proposals.length > 1 && !isReadOnly ? `
        <div class="tabs" role="tablist">
          <button role="tab" aria-selected="${activeIndex === 0}" onclick="App.selectProposal(0)">Best</button>
          ${this.state.proposals.length > 1 ? `<button role="tab" aria-selected="${activeIndex === 1}" onclick="App.selectProposal(1)">Alt 1</button>` : ''}
          ${this.state.proposals.length > 2 ? `<button role="tab" aria-selected="${activeIndex === 2}" onclick="App.selectProposal(2)">Alt 2</button>` : ''}
        </div>
      ` : ''}

      <div class="court-container" role="img" aria-label="${ariaLabel}">
        <div class="net-line"></div>
        <div class="court-grid">
          <div class="court-cell">${this.renderCourtToken(4, isReadOnly)}</div>
          <div class="court-cell">${this.renderCourtToken(3, isReadOnly)}</div>
          <div class="court-cell">${this.renderCourtToken(2, isReadOnly)}</div>
          <div class="court-cell">${this.renderCourtToken(5, isReadOnly)}</div>
          <div class="court-cell">${this.renderCourtToken(6, isReadOnly)}</div>
          <div class="court-cell">${this.renderCourtToken(1, isReadOnly)}</div>
        </div>
      </div>

      <div class="bench-row">
        <strong>Bench:</strong> ${this.state.bench.map(id => {
          const p = this.state.p.find(x => x.id === id);
          return p ? Share.formatName(p.name) : '';
        }).filter(n => n).join(' &middot; ') || 'None'}
      </div>

      ${!isReadOnly ? `
        <div class="rotation-controls">
          <button onclick="App.simulateRotation(-1)" aria-label="Undo rotation">&larr; Undo</button>
          <button onclick="App.simulateRotation(1)" aria-label="Rotate clockwise">&rarr; Rotate</button>
        </div>
      ` : ''}

      <table class="fit-table">
        <thead>
          <tr>
            <th scope="col">Position</th>
            <th scope="col">Player</th>
            <th scope="col">Fit</th>
          </tr>
        </thead>
        <tbody>
          ${[4,3,2,5,6,1].map(posNum => {
            const playerId = this.state.lineup[posNum];
            const player = this.state.p.find(p => p.id === playerId);
            if (!player) return '';
            const requiredRole = this.getPosRole(posNum);
            const fit = this.getPlayerFit(player, requiredRole);
            return `
              <tr>
                <td>${this.getRoleName(requiredRole)} (P${posNum})</td>
                <td>${Share.formatName(player.name)}</td>
                <td class="${fit.class}">${fit.text}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      ${!isReadOnly ? `
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
      this.state.lineup = prop.lineup;
      this.state.bench = prop.bench;
      this.state.selectedProposalIndex = index;
      this.updateUrl();
      this.render();
    }
  },

  simulateRotation(direction) {
    // direction = 1 for clockwise (rotate), -1 for counter-clockwise (undo)
    // 4->3, 3->2, 2->1, 1->6, 6->5, 5->4
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
      this.showToast(`${Share.formatName(newServer.name)} now serves.`);
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
