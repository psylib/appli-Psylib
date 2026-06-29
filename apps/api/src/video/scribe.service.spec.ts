import { describe, it, expect, vi } from 'vitest';
import {
  ScribeService,
  buildTemplatedSystemPrompt,
  formatDefaultNote,
  formatTemplatedNote,
  type ScribeNote,
  type TemplatedScribeNote,
} from './scribe.service';

function buildService() {
  const config = { get: vi.fn().mockReturnValue('') };
  return new ScribeService(
    {} as any, // prisma
    {} as any, // encryption
    {} as any, // audit
    {} as any, // notifications
    config as any,
  );
}

describe('buildTemplatedSystemPrompt', () => {
  const template = {
    name: 'Note TCC',
    sections: [
      { id: 'presenting', title: 'Motif de séance', placeholder: 'situation déclenchante' },
      { id: 'thoughts', title: 'Pensées automatiques' },
    ],
  };

  it('inclut le nom du modèle et chaque intitulé de section', () => {
    const prompt = buildTemplatedSystemPrompt(template);
    expect(prompt).toContain('Note TCC');
    expect(prompt).toContain('Motif de séance');
    expect(prompt).toContain('Pensées automatiques');
    expect(prompt).toContain('situation déclenchante');
  });

  it('conserve les règles cliniques absolues (pas de diagnostic, disclaimer)', () => {
    const prompt = buildTemplatedSystemPrompt(template);
    expect(prompt).toContain('Ne jamais formuler de diagnostic');
    expect(prompt).toContain('disclaimer');
  });
});

describe('formatDefaultNote', () => {
  it('rend le motif, le plan et le disclaimer', () => {
    const note: ScribeNote = {
      motif: 'Anxiété',
      contenu: 'Contenu de séance',
      thematiques: ['anxiété'],
      plan_therapeutique: 'Exposition progressive',
      points_vigilance: '',
      disclaimer: 'À valider par le praticien',
    };
    const md = formatDefaultNote(note);
    expect(md).toContain('**Motif :** Anxiété');
    expect(md).toContain('**Plan thérapeutique :** Exposition progressive');
    expect(md).toContain('À valider par le praticien');
    // points_vigilance vide → pas de section affichée
    expect(md).not.toContain('Points de vigilance');
  });
});

describe('formatTemplatedNote', () => {
  it('rend chaque section et marque les sections vides', () => {
    const note: TemplatedScribeNote = {
      sections: [
        { title: 'Motif de séance', content: 'Patient angoissé' },
        { title: 'Pensées automatiques', content: '' },
      ],
      thematiques: ['anxiété'],
      disclaimer: 'À valider',
    };
    const md = formatTemplatedNote(note);
    expect(md).toContain('**Motif de séance**');
    expect(md).toContain('Patient angoissé');
    expect(md).toContain('**Pensées automatiques**');
    expect(md).toContain('_(non abordé)_');
    expect(md).toContain('À valider');
  });
});

describe('ScribeService.buildNote — routing modèle', () => {
  it('utilise la note templatée quand un modèle est fourni', async () => {
    const service = buildService();
    const templated = vi
      .spyOn(service, 'generateTemplatedNote')
      .mockResolvedValue({ sections: [{ title: 'A', content: 'x' }], thematiques: ['t'], disclaimer: 'd' });
    const standard = vi.spyOn(service, 'generateNote');

    const out = await service.buildNote('transcript', {
      name: 'M',
      sections: [{ id: 'a', title: 'A' }],
    });

    expect(templated).toHaveBeenCalledOnce();
    expect(standard).not.toHaveBeenCalled();
    expect(out.tags).toEqual(['t']);
    expect(out.formattedNote).toContain('**A**');
  });

  it('utilise la note standard sans modèle', async () => {
    const service = buildService();
    const standard = vi.spyOn(service, 'generateNote').mockResolvedValue({
      motif: 'm',
      contenu: 'c',
      thematiques: ['t'],
      plan_therapeutique: 'p',
      points_vigilance: '',
      disclaimer: 'd',
    });
    const templated = vi.spyOn(service, 'generateTemplatedNote');

    const out = await service.buildNote('transcript');

    expect(standard).toHaveBeenCalledOnce();
    expect(templated).not.toHaveBeenCalled();
    expect(out.tags).toEqual(['t']);
    expect(out.formattedNote).toContain('**Motif :** m');
  });

  it('traite un modèle vide comme une note standard', async () => {
    const service = buildService();
    const standard = vi.spyOn(service, 'generateNote').mockResolvedValue({
      motif: 'm', contenu: 'c', thematiques: [], plan_therapeutique: 'p', points_vigilance: '', disclaimer: 'd',
    });
    await service.buildNote('t', { name: 'vide', sections: [] });
    expect(standard).toHaveBeenCalledOnce();
  });
});
