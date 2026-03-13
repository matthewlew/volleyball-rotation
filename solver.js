const Solver = {
  getCombinations(arr, k) {
    const result = [];
    const helper = (start, combo) => {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    };
    helper(0, []);
    return result;
  },

  getPermutations(arr) {
    const result = [];
    const helper = (current, remaining) => {
      if (remaining.length === 0) {
        result.push([...current]);
        return;
      }
      for (let i = 0; i < remaining.length; i++) {
        const nextCurrent = [...current, remaining[i]];
        const nextRemaining = remaining.slice(0, i).concat(remaining.slice(i + 1));
        helper(nextCurrent, nextRemaining);
      }
    };
    helper([], arr);
    return result;
  },

  scorePosition(player, role) {
    const pos = player.pos; // ["S", "O", "M"]
    if (!pos || pos.length === 0) return 1; // Untagged: can play any role
    const index = pos.indexOf(role);
    if (index === 0) return 3; // Primary
    if (index === 1) return 2; // Secondary
    if (index > 1) return 1;   // Can-do
    return 0; // Cannot
  },

  scoreLineup(p1, p2, p3, p4, p5, p6) {
    // 4-2 fixed mapping
    // P4 and P1 are Setters
    // P2 and P5 are Outsides
    // P3 and P6 are Middles
    const s1Score = this.scorePosition(p4, "S");
    const s2Score = this.scorePosition(p1, "S");
    const o1Score = this.scorePosition(p2, "O");
    const o2Score = this.scorePosition(p5, "O");
    const m1Score = this.scorePosition(p3, "M");
    const m2Score = this.scorePosition(p6, "M");

    // Invalid if someone is placed in a position they cannot play (score 0)
    if (s1Score === 0 || s2Score === 0 || o1Score === 0 || o2Score === 0 || m1Score === 0 || m2Score === 0) {
      return -1;
    }

    return s1Score + s2Score + o1Score + o2Score + m1Score + m2Score;
  },

  solve(roster) {
    // 1. Filter to present players
    const present = roster.filter(p => p.here);

    // 2. Validate counts
    if (present.length < 6) {
      return { error: `You have ${present.length} players checked in. Need at least 6 to play.` };
    }

    const allLineups = [];

    // 3. Generate all combinations of 6 players
    const combos = this.getCombinations(present, 6);

    for (const combo of combos) {
      // Find setters in this 6-player combo (untagged players can play any role incl. setter)
      const comboSetters = combo.filter(p => p.pos.includes("S") || p.pos.length === 0);
      if (comboSetters.length < 2) continue;

      // Try all pairs of setters
      const setterPairs = this.getCombinations(comboSetters, 2);

      for (const pair of setterPairs) {
        const sA = pair[0];
        const sB = pair[1];

        // Remaining 4 players
        const remaining = combo.filter(p => p.id !== sA.id && p.id !== sB.id);

        // Try permutations of remaining 4 into P2, P3, P5, P6
        const perms = this.getPermutations(remaining);

        // Two ways to assign setters to P4 and P1
        const setterAssigns = [
          { p4: sA, p1: sB },
          { p4: sB, p1: sA }
        ];

        for (const sAssign of setterAssigns) {
          for (const perm of perms) {
            const p2 = perm[0];
            const p3 = perm[1];
            const p5 = perm[2];
            const p6 = perm[3];

            const score = this.scoreLineup(sAssign.p1, p2, p3, sAssign.p4, p5, p6);

            if (score > 0) {
              const bench = present.filter(p => !combo.find(c => c.id === p.id)).map(p => p.id);

              const lineup = {
                1: sAssign.p1.id,
                2: p2.id,
                3: p3.id,
                4: sAssign.p4.id,
                5: p5.id,
                6: p6.id
              };

              allLineups.push({
                score,
                lineup,
                bench,
                // signature to deduplicate compositions
                // order doesn't matter for deduplicating exact compositions of the 6 players
                sig: [sAssign.p1.id, p2.id, p3.id, sAssign.p4.id, p5.id, p6.id].sort().join('-')
              });
            }
          }
        }
      }
    }

    if (allLineups.length === 0) {
       // It could be impossible if we require strict roles
       return { error: `No valid 4-2 lineup possible. Make sure players have flexible roles.` };
    }

    // Sort by score desc
    allLineups.sort((a, b) => b.score - a.score);

    // Deduplicate by signature
    const unique = [];
    const seen = new Set();
    for (const l of allLineups) {
      if (!seen.has(l.sig)) {
        seen.add(l.sig);
        unique.push(l);
      }
    }

    return { proposals: unique.slice(0, 3) };
  }
};

// If using Node (for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Solver;
}