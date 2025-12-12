// ======================================================
// util.js — Funções utilitárias e merge inteligente
// ======================================================

// Atualiza estado local
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ------------------------------------------------------
// Merge inteligente do progresso
// ------------------------------------------------------
export function mergeStates(local, remote) {
    const merged = deepClone(local);

    // Cada estado deve ter: materias, notes, updatedAt
    merged.materias = merged.materias || {};
    merged.notes = merged.notes || {};

    // -------------------------------------------
    // MERGE DAS MATÉRIAS
    // -------------------------------------------
    for (const materia of Object.keys(remote.materias || {})) {
        if (!merged.materias[materia]) {
            merged.materias[materia] = remote.materias[materia];
            continue;
        }

        // Merge de assuntos
        const localAssuntos = merged.materias[materia].assuntos || {};
        const remoteAssuntos = remote.materias[materia].assuntos || {};

        for (const assunto of Object.keys(remoteAssuntos)) {
            if (!localAssuntos[assunto]) {
                localAssuntos[assunto] = remoteAssuntos[assunto];
                continue;
            }

            // Se ambos têm timestamp, escolhe o mais recente
            const l = localAssuntos[assunto];
            const r = remoteAssuntos[assunto];

            if (!l.updatedAt || r.updatedAt > l.updatedAt) {
                localAssuntos[assunto] = r;
            }
        }

        merged.materias[materia].assuntos = localAssuntos;
    }

    // -------------------------------------------
    // MERGE DAS NOTAS
    // -------------------------------------------
    for (const key of Object.keys(remote.notes || {})) {
        if (!merged.notes[key]) {
            merged.notes[key] = remote.notes[key];
            continue;
        }

        // Se ambos têm timestamps, escolhe o mais recente
        if (remote.notes[key].updatedAt > merged.notes[key].updatedAt) {
            merged.notes[key] = remote.notes[key];
        }
    }

    // -------------------------------------------
    // Timestamp final
    // -------------------------------------------
    merged.updatedAt = Math.max(local.updatedAt || 0, remote.updatedAt || 0);

    return merged;
}
