const Share = {
  // Truncate name to first name, max 8 chars, add last initial if duplicate
  formatName(name, roster = []) {
    let first = name.split(' ')[0];
    let lastInitial = '';

    // Check for duplicate first names in roster
    if (roster && roster.length > 0) {
      const sameFirstName = roster.filter(p => p.name.split(' ')[0] === first && p.name !== name);
      if (sameFirstName.length > 0) {
        const parts = name.split(' ');
        if (parts.length > 1) {
          lastInitial = ' ' + parts[parts.length - 1][0] + '.';
        }
      }
    }

    let finalName = first + lastInitial;
    if (finalName.length > 8) {
      finalName = finalName.substring(0, 8);
    }
    return finalName;
  },

  getRoleColor(pos) {
    switch (pos) {
      case 'S': return '#6D28D9'; // Purple
      case 'M': return '#0369A1'; // Blue
      case 'O': return '#047857'; // Green
      default: return '#64748B'; // Gray fallback
    }
  },

  getRoleEmoji(pos) {
    switch (pos) {
      case 'S': return '🟣';
      case 'M': return '🔵';
      case 'O': return '🟢';
      default: return '⚪';
    }
  },

  getScoreInfo(roster, lineup) {
    let totalScore = 0;
    // P4 and P1 = S, P3 and P6 = M, P2 and P5 = O
    const getPosRole = (p) => {
      if (p == 4 || p == 1) return 'S';
      if (p == 3 || p == 6) return 'M';
      if (p == 2 || p == 5) return 'O';
      return '';
    };

    let isStretch = false;

    for (let p = 1; p <= 6; p++) {
      const playerId = lineup[p];
      const player = roster.find(r => r.id === playerId);
      if (player) {
        const requiredRole = getPosRole(p);
        const idx = player.pos.indexOf(requiredRole);
        if (idx === 0) totalScore += 3;
        else if (idx === 1) totalScore += 2;
        else if (idx > 1) {
          totalScore += 1;
          isStretch = true;
        }
      }
    }

    return { score: totalScore, max: 18, isStretch };
  },

  generateEmojiText(teamName, roster, lineup, bench, urlHash) {
    // 🏐 The Rebels · 4-2
    //
    // 🟣 Peter   🔵 Saif   🟢 Chris
    // ━━━━━━ NET ━━━━━━
    // 🟢 DAngelo  🔵 JP   🟣 Tommy 🎤
    //
    // 💺 Apurva · Kyle
    //
    // 17/18 · subin.app/#[hash]

    const p4 = roster.find(p => p.id === lineup[4]);
    const p3 = roster.find(p => p.id === lineup[3]);
    const p2 = roster.find(p => p.id === lineup[2]);
    const p5 = roster.find(p => p.id === lineup[5]);
    const p6 = roster.find(p => p.id === lineup[6]);
    const p1 = roster.find(p => p.id === lineup[1]);

    const formatPlayer = (player, role) => {
      if (!player) return '';
      return `${this.getRoleEmoji(role)} ${this.formatName(player.name)}`;
    };

    let text = `🏐 ${teamName} · 4-2\n\n`;
    text += `${formatPlayer(p4, 'S')}   ${formatPlayer(p3, 'M')}   ${formatPlayer(p2, 'O')}\n`;
    text += `━━━━━━ NET ━━━━━━\n`;
    text += `${formatPlayer(p5, 'O')}   ${formatPlayer(p6, 'M')}   ${formatPlayer(p1, 'S')} 🎤\n\n`;

    if (bench && bench.length > 0) {
      const benchNames = bench.map(id => {
        const p = roster.find(r => r.id === id);
        return p ? this.formatName(p.name) : '';
      }).filter(n => n).join(' · ');
      text += `💺 ${benchNames}\n\n`;
    }

    const { score, max, isStretch } = this.getScoreInfo(roster, lineup);
    text += `${score}/${max}${isStretch ? ' ⚠️' : ''} · subin.app/#${urlHash}`;

    return text;
  },

  async copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  },

  async generatePNG(teamName, roster, lineup, bench) {
    const scale = 2;
    const width = 520 * scale;
    const height = 680 * scale;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Bg
    ctx.fillStyle = '#F7F5F0';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F59E0B'; // Amber
    ctx.font = `bold ${24 * scale}px Figtree, sans-serif`;
    ctx.fillText(`${teamName}`.toUpperCase(), width / 2, 40 * scale);
    ctx.fillStyle = '#64748B';
    ctx.font = `bold ${14 * scale}px Figtree, sans-serif`;
    ctx.fillText(`4-2 ROTATION · SUB IN`, width / 2, 65 * scale);

    // Court
    const courtX = 40 * scale;
    const courtY = 100 * scale;
    const courtW = 440 * scale;
    const courtH = 440 * scale;

    ctx.fillStyle = '#0F2137'; // Deep navy
    ctx.fillRect(courtX, courtY, courtW, courtH);

    // Net
    ctx.fillStyle = '#F59E0B'; // Amber
    ctx.fillRect(courtX, courtY + courtH / 2 - 2 * scale, courtW, 4 * scale);

    // Tokens
    const renderToken = (pIndex, cx, cy, role, hasMic = false) => {
      const pId = lineup[pIndex];
      const player = roster.find(p => p.id === pId);
      if (!player) return;
      const name = this.formatName(player.name);

      const r = 36 * scale;

      // Token background
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Colored top border
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, 0);
      ctx.lineWidth = 6 * scale;
      ctx.strokeStyle = this.getRoleColor(role);
      ctx.stroke();

      // Text
      ctx.fillStyle = '#0F172A';
      ctx.font = `bold ${14 * scale}px Figtree, sans-serif`;
      ctx.fillText(name, cx, cy - 2 * scale);

      ctx.fillStyle = this.getRoleColor(role);
      ctx.font = `bold ${16 * scale}px Figtree, sans-serif`;
      ctx.fillText(role, cx, cy + 18 * scale);

      if (hasMic) {
        ctx.fillStyle = '#0F172A';
        ctx.font = `${14 * scale}px sans-serif`;
        ctx.fillText('🎤', cx + r + 10 * scale, cy);
      }
    };

    // P4 P3 P2 (front row, net is at H/2)
    // Wait, the front row is closer to the net. Let's put front row at top half or bottom half.
    // Net is middle. Front row is below the net. Back row is further below.
    // But PRD standard numbering:
    //        [ NET ]
    // P4(S)   P3(M)   P2(OH)
    // P5(OH)  P6(M)   P1(S/serves)
    //
    // So Net is at the TOP of the team's side.
    // Let's draw the full court as the team's half, or court is both halves?
    // PRD says: "Court diagram: Dark navy court, amber net line, 6 player tokens in correct positions"
    // Usually a lineup app only shows your team's side.
    // Let's make the top edge the net.
    // Actually PRD says:
    // ━━━━━━ NET ━━━━━━
    // 🟢 DAngelo  🔵 JP   🟣 Tommy 🎤
    // In the emoji, P4 P3 P2 are ABOVE the net. Wait, the emoji text says:
    // 🟣 Peter   🔵 Saif   🟢 Chris
    // ━━━━━━ NET ━━━━━━
    // 🟢 DAngelo  🔵 JP   🟣 Tommy 🎤
    // This implies Peter (P4) is on the OTHER side of the net? No, it means the team is facing the net, and we are looking top-down.
    // The emoji text puts Front Row ABOVE the net. But front row shouldn't be separated by the net from back row!
    // Ah, emoji shows:
    // P4 P3 P2
    // ---NET---
    // P5 P6 P1
    // That means the net is BETWEEN them? That's incorrect for volleyball, but PRD says EXACTLY:
    // 🟣 Peter   🔵 Saif   🟢 Chris
    // ━━━━━━ NET ━━━━━━
    // 🟢 DAngelo  🔵 JP   🟣 Tommy 🎤
    // I MUST follow the exact PRD format for the Emoji.
    // For the Canvas court, I will put the Net at the TOP.
    // Let's adjust court rendering: Net at `courtY`.
    // Actually, I'll draw a half-court.

    // Better: let's stick to the PRD for court visualization.
    // PRD: "Court diagram: Dark navy court (#0F2137), amber net line (#F59E0B), 6 player tokens in correct P1–P6 positions"
    // So court is a square. Net is at the middle.

    // Front row (above the net visually, or below?)
    // Let's put Front Row (P4, P3, P2) in the top half of their side.
    const rowFrontY = courtY + 100 * scale;
    const rowBackY = courtY + 300 * scale;
    const colLeftX = courtX + courtW * 0.2;
    const colMidX = courtX + courtW * 0.5;
    const colRightX = courtX + courtW * 0.8;

    // Let's just put Net at the top edge of the court rect to save space and make it clear.
    ctx.fillRect(courtX, courtY, courtW, courtH);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(courtX, courtY, courtW, 6 * scale); // Top edge is net

    // P4 (Front left), P3 (Front mid), P2 (Front right)
    renderToken(4, colLeftX, rowFrontY, 'S');
    renderToken(3, colMidX, rowFrontY, 'M');
    renderToken(2, colRightX, rowFrontY, 'O');

    // P5 (Back left), P6 (Back mid), P1 (Back right)
    renderToken(5, colLeftX, rowBackY, 'O');
    renderToken(6, colMidX, rowBackY, 'M');
    renderToken(1, colRightX, rowBackY, 'S', true);

    // Bench
    const benchY = courtY + courtH + 40 * scale;
    if (bench && bench.length > 0) {
      const benchNames = bench.map(id => {
        const p = roster.find(r => r.id === id);
        return p ? this.formatName(p.name) : '';
      }).filter(n => n).join(' · ');
      ctx.fillStyle = '#CBD5E1';
      ctx.font = `bold ${16 * scale}px Figtree, sans-serif`;
      ctx.fillText(`Bench: ${benchNames}`, width / 2, benchY);
    }

    // Footer
    ctx.fillStyle = '#64748B';
    ctx.font = `bold ${14 * scale}px Figtree, sans-serif`;
    ctx.fillText(`subin.app`, width / 2, height - 30 * scale);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  },

  async shareImage(teamName, roster, lineup, bench) {
    const blob = await this.generatePNG(teamName, roster, lineup, bench);
    const file = new File([blob], 'lineup.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${teamName} Lineup`,
          text: 'Generated with Sub In'
        });
      } catch (err) {
        console.error('Error sharing', err);
        this.downloadFile(file);
      }
    } else {
      this.downloadFile(file);
    }
  },

  downloadFile(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// If using Node (for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Share;
}