// shots.js — fixed scenes for screenshots. Each shot sets up the app exactly as
// the screenshot needs it: a finished cover, or the editor with a photo loaded.
// The photos used are the kit's own free-to-use sample photos (app/samples/).
import { defaultState } from './cover.js';

/**
 * @param {string} shot - the ?shot= value
 * @param {URLSearchParams} params
 * @param {{ loadImage: Function, setState: Function, photos: Array, redraw: Function }} api
 */
export async function runShot(shot, params, api) {
  const caption = params.get('caption') || 'SUNSET HEIST';
  const base = defaultState();
  base.caption = caption;
  if (shot === 'cover') {
    api.setState(base);
  } else if (shot === 'cover-neon') {
    base.grade = 'neon';
    base.caption = params.get('caption') || 'NEON NIGHTS';
    base.subtitle = 'VICE CITY AFTER DARK';
    api.setState(base);
  } else if (shot === 'cover-portrait') {
    base.size = 'portrait';
    base.caption = params.get('caption') || 'LEONIDA HEAT';
    api.setState(base);
  } else if (shot === 'editor') {
    // the editor with a real photo loaded into the hero panel
    const photo = await api.loadImage('./samples/pier.jpg');
    api.photos.push(photo);
    base.panels[0].source = 'photo';
    base.panels[0].photo = 0;
    base.caption = params.get('caption') || 'PIER NIGHTS';
    api.setState(base);
  } else {
    api.setState(base);
  }
}
