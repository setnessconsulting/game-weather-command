# Weather Command — Asset, Audio, and Provenance Policy

Status: binding WC-01 production policy

## Principle

Shipping assets must be original, generated/commissioned with documented rights, or licensed for the intended distribution. "Found online" is not acceptable provenance.

Comparator games are references for quality dimensions only. No comparator asset, layout, wording, sound, map, icon set, or scenario content may be copied.

## Asset categories

Track at minimum:
- UI icons;
- weather/system symbols;
- map/background art;
- textures/patterns;
- illustrations;
- fonts;
- sound effects;
- ambient audio/music if any;
- Figma-exported production assets;
- generated assets;
- third-party libraries that embed assets.

## Provenance record

Every non-code shipping asset has:

```text
asset_id
path
category
creator/source
creation method
license/rights basis
source URL or original-work reference
modifications
reviewer
review date
release status
```

## Original work

Prefer original project-owned assets for:
- visual identity;
- icons central to interaction;
- map/weather presentation;
- feedback sounds.

Original work should still record creator/tool/date so future audits can distinguish it from unknown-source material.

## Generated assets

If generative tools are used:
- record tool/provider and date;
- preserve prompt/working provenance privately where appropriate;
- perform human originality review;
- do not request or retain a direct imitation of a comparator's protected visual style;
- ensure output is safe to distribute under project policy.

## Fonts

Prefer system or well-understood open-license fonts.

If a font is bundled:
- record exact license;
- bundle required license text;
- verify allowed web embedding.

Do not add a font solely for novelty if it degrades readability or bundle size.

## Weather symbols

Standard scientific notation may be used where appropriate, but:
- implementation assets must be original/openly licensed;
- success cannot depend on memorizing symbol names;
- non-color semantic labels remain available.

## Map art

The v1 region is fictional/synthetic unless a later decision requires a real geography.

Do not depend on third-party map tiles.

If real geographic shapes are introduced:
- record dataset source/license;
- include attribution if required;
- simplify only in ways that preserve intended learning.

## Audio

Audio must be:
- original or clearly licensed;
- small/bounded;
- optional;
- represented in the provenance manifest;
- absent from essential-information-only channels.

No unlicensed commercial music or ripped game sounds.

## Figma

A Figma file becomes design authority only after WC-DESIGN records:
- file key;
- version/checkpoint;
- relevant pages/frames;
- asset ownership/provenance status.

Exports must be traceable back to the approved design revision.

## Release manifest

WC-10/WC-13 maintain a machine-readable asset/provenance manifest.

Minimum shipping fields:
- asset path/hash;
- provenance ID;
- license category;
- release approval.

## Release blocker

Unknown or incompatible provenance for a shipping asset is release-blocking until the asset is:
- replaced;
- proven distributable; or
- explicitly removed from the build.
