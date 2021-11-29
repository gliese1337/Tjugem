import fs from 'fs';
import WavEncoder from 'wav-encoder'; 
import { TextModel, AcousticModel } from "whistle-synthesis";


/* Vowels:
  HH = i
  LL = u
  HM = ja
  LM = wa
  HLM = ju
  LHM = wi
  Schwa = e
*/

/* Consonants:
    I  C  D
  A t  d  n
  M k  g  q
  G p  b  m
*/

const amodel: AcousticModel = {
  wordBoundary: ' ',
  classes: {
    A: ['t', 'd', 'n'], // Acute 
    M: ['k', 'g', 'q'], // Mid
    G: ['p', 'b', 'm'], // Grave
    I: ['t', 'k', 'p'], // Interrupted
    K: ['d', 'g', 'b'], // Continuous
    D: ['n', 'q', 'm'], // Delayed
    C: ['I', 'K', 'D'],
    HV: ['i', 'ja', 'ju'],
    LV: ['u', 'wa', 'wi'],
    SV: ['HV', 'LV'],
  },
  constants: {
    A_LOCUS: 3000, // acute
    H_LOCUS: 2600, // high
    M_LOCUS: 2175, // mid
    L_LOCUS: 1750, // low
    G_LOCUS: 1350, // grave
  },
  namedPronunciations: {
    break: [{ a: { type: 'constant', y: 0 }, run: 50 }],
    A: [{ 
      f: { type: 'constant', y: 'A_LOCUS' },
      a: { type: 'constant', y: 1 },
    }],
    G: [{
      f: { type: 'constant', y: 'G_LOCUS' },
      a: { type: 'constant', y: 1 },
    }],
    I2H: ['break', { // Interrupted to i, ja, ju 
      f: { type: 'transition', curve: 'convex', ey: 'H_LOCUS' },
      a: { type: 'constant', y: 1 },
      run: 200,
    }],
    I2M: ['break', { // Interrupted to e 
      f: { type: 'transition', curve: 'convex', ey: 'M_LOCUS' },
      a: { type: 'constant', y: 1 },
      run: 200,
    }],
    I2L: ['break', { // Interrupted to u, wa, wi
      f: { type: 'transition', curve: 'convex', ey: 'L_LOCUS' },
      a: { type: 'constant', y: 1 },
      run: 200,
    }],
    K2H: [{ // Continuous to i, ja, ju
      f: { type: 'transition', curve: 'sine', ey: 'H_LOCUS' },
      a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
      run: 250,
    }],
    K2M: [{ // Continuous to e
      f: { type: 'transition', curve: 'sine', ey: 'M_LOCUS' },
      a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
      run: 250,
    }],
    K2L: [{ // Continuous to u, wa, wi
      f: { type: 'transition', curve: 'sine', ey: 'L_LOCUS' },
      a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
      run: 250,
    }],
    D2H: ['break', { // Delayed to i, ja, ju 
      f: { type: 'transition', curve: 'sine', ey: 'H_LOCUS' },
      a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
      run: 200,
    }],
    D2M: ['break', { // Delayed to e
      f: { type: 'transition', curve: 'sine', ey: 'M_LOCUS' },
      a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
      run: 200,
    }],
    D2L: ['break', { // Delayed to u, wa, wi 
      f: { type: 'transition', curve: 'sine', ey: 'L_LOCUS' },
      a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
      run: 200,
    }],
    HIGH: [{ f: { type: 'constant', y: 'H_LOCUS' } }],
    LOW: [{ f: { type: 'constant', y: 'L_LOCUS' } }],
    M1: [{
      f: { type: 'transition', curve: 'sine', ey: 'M_LOCUS' },
      a: { type: 'constant', y: 1 },
      run: 200
    }],
    M2: [{
      f: { type: 'transition', curve: 'sine', ey: 'M_LOCUS' },
      a: { type: 'constant', y: 1 },
      run: 100
    }],
    // t - Acute, Interrupted
    ti: ['A', 'I2H'],
    te: ['A', 'I2M'],
    tu: ['A', 'I2L'],
    vt: [{ f: { type: 'transition', curve: 'convex', ey: 'A_LOCUS' }, run: 200 }],
    // d - Acute, Continuous
    di: ['A', 'K2H'],
    de: ['A', 'K2M'],
    du: ['A', 'K2L'],
    vd: [{ 
      f: { type: 'transition', curve: 'sine', ey: 'A_LOCUS' },
      a: { type: 'transition', curve: 'sine', ey: 0 },
      run: 250,
    }],
    // n - Acute, Delayed
    ni: ['A', 'D2H'],
    ne: ['A', 'D2M'],
    nu: ['A', 'D2L'],
    vn: [{ 
      f: { type: 'transition', curve: 'convex', ey: 'A_LOCUS' },
      a: { type: 'transition', curve: 'sine', ey: 0 },
      run: 200,
    }, 'break'],
    
    // k - Mid, Interrupted
    kv: ['break', { run: 100 }],
    vk: [{ run: 100 }, 'break'],
    // g - Mid, Continuous
    gi: ['K2H'],
    ge: ['K2M'],
    gu: ['K2L'],
    vg: [{ a: { type: 'transition', curve: 'sine', ey: 0 }, run: 250 }],
    // q - Mid, Delayed
    qi: ['break', 'D2H'],
    qe: ['break', 'D2M'],
    qu: ['break', 'D2L'],
    vq: [{ a: { type: 'transition', curve: 'sine', ey: 0 }, run: 200 }, 'break'],
   
    // p - Grave, Interrupted
    pi: ['G', 'I2H'],
    pe: ['G', 'I2M'],
    pu: ['G', 'I2L'],
    vp: [{ f: { type: 'transition', curve: 'convex', ey: 'G_LOCUS' }, run: 200 }],
    // b - Grave, Continuous
    bi: ['G', 'K2H'],
    be: ['A', 'K2M'],
    bu: ['G', 'K2L'],
    vb: [{ 
      f: { type: 'transition', curve: 'sine', ey: 'G_LOCUS' },
      a: { type: 'transition', curve: 'sine', ey: 0 },
      run: 250,
    }],
    // m - Grave, Delayed
    mi: ['G', 'D2H'],
    me: ['G', 'D2M'],
    mu: ['G', 'D2L'],
    vm: [{ 
      f: { type: 'transition', curve: 'convex', ey: 'G_LOCUS' },
      a: { type: 'transition', curve: 'sine', ey: 0 },
      run: 200,
    }, 'break'],
  },
  graphemes: {
    /* VOWELS */
    i: {
      elsewhere: ['HIGH', {
        a: { type: 'constant', y: 1 },
        run: 166,
      }],
      contexts: [{
        con: ['C', ''],
        pron: ['HIGH', {
          a: { type: 'constant', y: 1 },
          run: 166,
        }, 'vk'],
      }]
    },
    ja: {
      elsewhere: ['HIGH', 'M1'],
      contexts: [{
        con: ['C', ''],
        pron: ['HIGH', 'M1', 'vk'],
      }]
    },
    ju: {
      elsewhere: ['HIGH',{
        f: { type: 'transition', curve: 'sine', ey: 'L_LOCUS' },
        a: { type: 'constant', y: 1 },
        run: 100,
      }, 'M2'],
      contexts: [{
        con: ['C', 'A'],
        pron: ['HIGH', {
          f: { type: 'transition', curve: 'sine', ey: 'L_LOCUS' },
          a: { type: 'constant', y: 1 },
          run: 200,
        }]
      },{
        con: ['C', ''],
        pron: ['HIGH', {
          f: { type: 'transition', curve: 'sine', ey: 'L_LOCUS' },
          a: { type: 'constant', y: 1 },
          run: 200,
        }, 'vk'],
      }]
    },
    u: {
      elsewhere: ['LOW', {
        a: { type: 'constant', y: 1 },
        run: 166,
      }],
      contexts: [{
        con: ['C', ''],
        pron: ['LOW', {
          a: { type: 'constant', y: 1 },
          run: 166,
        }, 'vk'],
      }]
    },
    wa: {
      elsewhere: ['LOW', 'M1'],
      contexts: [{
        con: ['C', ''],
        pron: ['LOW', 'M1', 'vk'],
      }]
    },
    wi: {
      elsewhere: ['LOW', {
        f: { type: 'transition', curve: 'sine', ey: 'H_LOCUS' },
        a: { type: 'constant', y: 1 },
        run: 100,
      }, 'M2'],
      contexts: [{
        con: ['C', 'G'],
        pron: ['LOW', {
          f: { type: 'transition', curve: 'sine', ey: 'H_LOCUS' },
          a: { type: 'constant', y: 1 },
          run: 200,
        }],
      },{
        con: ['C', ''],
        pron: ['LOW', {
          f: { type: 'transition', curve: 'sine', ey: 'H_LOCUS' },
          a: { type: 'constant', y: 1 },
          run: 200,
        }, 'vk'],
      }]
    },
    e: {
      contexts: [
        // A to A
        { con: ['t', 'A'], pron: 'ti' },
        { con: ['d', 'A'], pron: 'di' },
        { con: ['n', 'A'], pron: 'ni' },
        // G to G
        { con: ['p', 'G'], pron: 'pu' },
        { con: ['b', 'G'], pron: 'bu' },
        { con: ['m', 'G'], pron: 'mu' },
        // A to M
        { con: ['t', 'M'], pron: 'te' },
        { con: ['d', 'M'], pron: 'de' },
        { con: ['n', 'M'], pron: 'ne' },
        // G to M
        { con: ['p', 'M'], pron: 'pe' },
        { con: ['b', 'M'], pron: 'be' },
        { con: ['m', 'M'], pron: 'me' },
        //Word Final
        { con: ['t', ''], pron: ['ti', 'vk'] },
        { con: ['d', ''], pron: ['di', 'vk'] },
        { con: ['n', ''], pron: ['ni', 'vk'] },
        { con: ['k', ''], pron: ['kv', 'vk'] },
        { con: ['g', ''], pron: ['ge', 'vk'] },
        { con: ['q', ''], pron: ['qe', 'vk'] },
        { con: ['p', ''], pron: ['pu', 'vk'] },
        { con: ['b', ''], pron: ['bu', 'vk'] },
        { con: ['m', ''], pron: ['mu', 'vk'] },
        // A to G / G to A
        {
          con: ['t', 'p'],
          pron: ['break', {
            f: { type: 'transition', curve: 'arcsine', sy: 'A_LOCUS', ey: 'G_LOCUS' },
            a: { type: 'constant', y: 1 },
            run: 200,
          },'break'],
        },{
          con: ['p', 't'],
          pron: ['break', {
            f: { type: 'transition', curve: 'arcsine', sy: 'G_LOCUS', ey: 'A_LOCUS' },
            a: { type: 'constant', y: 1 },
            run: 200,
          }, 'break'],
        },{
          con: ['d', 'p'],
          pron: [{
            f: { type: 'transition', curve: 'convex', sy: 'A_LOCUS', ey: 'G_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
            run: 250,
          },'break'],
        },{
          con: ['p', 'd'],
          pron: ['break', {
            f: { type: 'transition', curve: 'arcsine', sy: 'G_LOCUS', ey: 'A_LOCUS' },
            a: { type: 'constant', y: 1 },
            run: 200,
          }, 'break'],
        },{
          con: ['n', 'p'],
          pron: ['break', {
            f: { type: 'transition', curve: 'convex', sy: 'A_LOCUS', ey: 'G_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
            run: 200,
          },'break'],
        },{
          con: ['p', 'n'],
          pron: ['break', {
            f: { type: 'transition', curve: 'concave', sy: 'G_LOCUS', ey: 'A_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 1, ey: 0 },
            run: 200,
          }, 'break']
        },{
          con: ['t', 'b'],
          pron: ['break', {
            f: { type: 'transition', curve: 'concave', sy: 'A_LOCUS', ey: 'G_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 1, ey: 0 },
            run: 250,
          }],
        },{
          con: ['b', 't'],
          pron: [{
            f: { type: 'transition', curve: 'concave', sy: 'G_LOCUS', ey: 'A_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
            run: 250,
          }, 'break'],
        },{
          con: ['d', 'b'],
          pron: [{
            f: { type: 'transition', curve: 'sine', sy: 'A_LOCUS', ey: 'G_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 300,
          }],
        },{
          con: ['b', 'd'],
          pron: [{
            f: { type: 'transition', curve: 'sine', sy: 'G_LOCUS', ey: 'A_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 300,
          }],
        },{
          con: ['n', 'b'],
          pron: ['break', {
            f: { type: 'transition', curve: 'sine', sy: 'A_LOCUS', ey: 'G_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
            run: 250,
          }],
        },{
          con: ['b', 'n'],
          pron: [{
            f: { type: 'transition', curve: 'sine', sy: 'G_LOCUS', ey: 'A_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 250,
          }, 'break'],
        },{
          con: ['t', 'm'],
          pron: ['break', {
            f: { type: 'transition', curve: 'concave', sy: 'A_LOCUS', ey: 'G_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 1, ey: 0 },
            run: 200,
          }, 'break'],
        },{
          con: ['m', 't'],
          pron: ['break', {
            f: { type: 'transition', curve: 'concave', sy: 'G_LOCUS', ey: 'A_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
            run: 200,
          }, 'break'],
        },{
          con: ['d', 'm'],
          pron: [{
            f: { type: 'transition', curve: 'sine', sy: 'A_LOCUS', ey: 'G_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 250,
          }, 'break'],
        },{
          con: ['m', 'd'],
          pron: ['break', {
            f: { type: 'transition', curve: 'sine', sy: 'G_LOCUS', ey: 'A_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 250,
          }],
        },{
          con: ['n', 'm'],
          pron: ['break', {
            f: { type: 'transition', curve: 'sine', sy: 'A_LOCUS', ey: 'G_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 200,
          }, 'break'],
        },{
          con: ['m', 'n'],
          pron: ['break', {
            f: { type: 'transition', curve: 'sine', sy: 'G_LOCUS', ey: 'A_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 200,
          }, 'break'],
        },
        // M to A / G
        {
          con: ['k', 't'],
          pron: ['break',{
            f: { type: 'transition', curve: 'concave', ey: 'A_LOCUS' },
            a: { type: 'constant', y: 1 },
            run: 200,
          },'break']
        },{
          con: ['k', 'p'],
          pron: ['break',{
            f: { type: 'transition', curve: 'convex', ey: 'G_LOCUS' },
            a: { type: 'constant', y: 1 },
            run: 200,
          },'break']
        },{
          con: ['k', 'd'],
          pron: ['break',{
            f: { type: 'transition', curve: 'sine', ey: 'A_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 1, ey: 0 },
            run: 250,
          }]
        },{
          con: ['k', 'b'],
          pron: ['break',{
            f: { type: 'transition', curve: 'sine', ey: 'G_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 1, ey: 0 },
            run: 250,
          }]
        },{
          con: ['k', 'n'],
          pron: ['break',{
            f: { type: 'transition', curve: 'sine', ey: 'A_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 1, ey: 0 },
            run: 200
          },'break']
        },{
          con: ['k', 'm'],
          pron: ['break',{
            f: { type: 'transition', curve: 'sine', ey: 'G_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 1, ey: 0 },
            run: 200
          },'break']
        },{
          con: ['g', 't'],
          pron: [{
            f: { type: 'transition', curve: 'sine', ey: 'A_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
            run: 250,
          },'break']
        },{
          con: ['g', 'p'],
          pron: [{
            f: { type: 'transition', curve: 'sine', ey: 'G_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
            run: 250,
          },'break']
        },{
          con: ['g', 'd'],
          pron: [{
            f: { type: 'transition', curve: 'sine', ey: 'A_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 300,
          }]
        },{
          con: ['g', 'b'],
          pron: [{
            f: { type: 'transition', curve: 'sine', ey: 'G_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 300,
          }]
        },{
          con: ['g', 'n'],
          pron: [{
            f: { type: 'transition', curve: 'sine', ey: 'A_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 250,
          },'break']
        },{
          con: ['g', 'm'],
          pron: [{
            f: { type: 'transition', curve: 'sine', ey: 'G_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 250,
          },'break']
        },{
          con: ['q', 't'],
          pron: ['break',{
            f: { type: 'transition', curve: 'sine', ey: 'A_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
            run: 200,
          },'break']
        },{
          con: ['q', 'p'],
          pron: ['break',{
            f: { type: 'transition', curve: 'sine', ey: 'G_LOCUS' },
            a: { type: 'transition', curve: 'sine', sy: 0, ey: 1 },
            run: 200,
          },'break']
        },{
          con: ['q', 'd'],
          pron: ['break',{
            f: { type: 'transition', curve: 'sine', ey: 'A_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 250
          }]
        },{
          con: ['q', 'b'],
          pron: ['break',{
            f: { type: 'transition', curve: 'sine', ey: 'G_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 250
          }]
        },{
          con: ['q', 'n'],
          pron: ['break',{
            f: { type: 'transition', curve: 'sine', ey: 'A_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 200,
          },'break']
        },{
          con: ['q', 'm'],
          pron: ['break',{
            f: { type: 'transition', curve: 'sine', ey: 'G_LOCUS' },
            a: { type: 'contour', curve: 'sine', y: 0, a: 1 },
            run: 200,
          },'break']
        },
      ],
    },

    /* CONSONANTS */
    t: {
      contexts: [
        { con: ['SV', 'HV'], pron: ['vt', 'ti'] },
        { con: ['SV', 'LV'], pron: ['vt', 'tu'] },
        { con: ['SV', ''], pron: ['vt', 'break'] },
        { con: ['e', 'HV'], pron: 'ti'},
        { con: ['e', 'LV'], pron: 'tu'},
        { con: ['e', ''], pron: 'break' },
        { con: ['', 'HV'], pron: 'ti' },
        { con: ['', 'LV'], pron: 'tu' },
        { con: ['SV', 'e'], pron: 'vt' },
        { con: ['e', 'e'] },
        { con: ['', 'e'] },
      ],
    },
    d: {
      contexts: [
        { con: ['SV', 'HV'], pron: ['vd', 'di'] },
        { con: ['SV', 'LV'], pron: ['vd', 'du'] },
        { con: ['e', 'HV'], pron: 'di'},
        { con: ['e', 'LV'], pron: 'du'},
        { con: ['', 'HV'], pron: 'di' },
        { con: ['', 'LV'], pron: 'du' },
        { con: ['SV', 'e'], pron: 'vd' },
        { con: ['e', 'e'] },
        { con: ['', 'e'] },
      ],
    },
    n: {
      contexts: [
        { con: ['SV', 'HV'], pron: ['vn', 'ni'] },
        { con: ['SV', 'LV'], pron: ['vn', 'nu'] },
        { con: ['SV', ''], pron: ['vn', 'break'] },
        { con: ['e', 'HV'], pron: 'ni'},
        { con: ['e', 'LV'], pron: 'nu'},
        { con: ['e', ''], pron: 'break' },
        { con: ['SV', 'e'], pron: 'vn' },
        { con: ['e', 'e'] },
        { con: ['', 'e'] },
      ],
    },
    k: {
      contexts: [
        { con: ['SV', 'HV'], pron: ['vk', 'kv'] },
        { con: ['SV', 'LV'], pron: ['vk', 'kv'] },
        { con: ['SV', ''], pron: ['vk', 'break'] },
        { con: ['e', 'SV'], pron: 'kv'},
        { con: ['e', ''], pron: 'break' },
        { con: ['', 'SV'], pron: 'kv' },
        { con: ['SV', 'e'], pron: 'vk' },
        { con: ['e', 'e'] },
        { con: ['', 'e'] },
      ],
    },
    g: {
      contexts: [
        { con: ['SV', 'HV'], pron: ['vg', 'gi'] },
        { con: ['SV', 'LV'], pron: ['vg', 'gu'] },
        { con: ['e', 'HV'], pron: 'gi'},
        { con: ['e', 'LV'], pron: 'gu'},
        { con: ['', 'HV'], pron: 'gi' },
        { con: ['', 'LV'], pron: 'gu' },
        { con: ['SV', 'e'], pron: 'vg' },
        { con: ['e', 'e'] },
        { con: ['', 'e'] },
      ],
    },
    q: {
      contexts: [
        { con: ['SV', 'HV'], pron: ['vq', 'qi'] },
        { con: ['SV', 'LV'], pron: ['vq', 'qu'] },
        { con: ['SV', ''], pron: ['vq', 'break'] },
        { con: ['e', 'HV'], pron: 'qi'},
        { con: ['e', 'LV'], pron: 'qu'},
        { con: ['e', ''], pron: 'break' },
        { con: ['SV', 'e'], pron: 'vq' },
        { con: ['e', 'e'] },
        { con: ['', 'e'] },
      ],
    },
    p: {
      contexts: [
        { con: ['SV', 'HV'], pron: ['vp', 'pi'] },
        { con: ['SV', 'LV'], pron: ['vp', 'pu'] },
        { con: ['SV', ''], pron: ['vp', 'break'] },
        { con: ['e', 'HV'], pron: 'pi'},
        { con: ['e', 'LV'], pron: 'pu'},
        { con: ['e', ''], pron: 'break' },
        { con: ['', 'HV'], pron: 'pi' },
        { con: ['', 'LV'], pron: 'pu' },
        { con: ['SV', 'e'], pron: 'vp' },
        { con: ['e', 'e'] },
        { con: ['', 'e'] },
      ],
    },
    b: {
      contexts: [
        { con: ['SV', 'HV'], pron: ['vb', 'bi'] },
        { con: ['SV', 'LV'], pron: ['vb', 'bu'] },
        { con: ['e', 'HV'], pron: 'bi'},
        { con: ['e', 'LV'], pron: 'bu'},
        { con: ['', 'HV'], pron: 'bi' },
        { con: ['', 'LV'], pron: 'bu' },
        { con: ['SV', 'e'], pron: 'vb' },
        { con: ['e', 'e'] },
        { con: ['', 'e'] },
      ],
    },
    m: {
      contexts: [
        { con: ['SV', 'HV'], pron: ['vm', 'mi'] },
        { con: ['SV', 'LV'], pron: ['vm', 'mu'] },
        { con: ['SV', ''], pron: ['vm', 'break'] },
        { con: ['e', 'HV'], pron: 'mi'},
        { con: ['e', 'LV'], pron: 'mu'},
        { con: ['e', ''], pron: 'break' },
        { con: ['SV', 'e'], pron: 'vm' },
        { con: ['e', 'e'] },
        { con: ['', 'e'] },
      ],
    },
  },
};

const tmodel = new TextModel(amodel);

const sampleRate = 44100;

const [PCM] = tmodel.synthesize({ text: process.argv[2], settings: { sampleRate } });

WavEncoder.encode({
  sampleRate,
  channelData: [PCM as Float32Array],
}).then((buffer: ArrayBuffer) => {
  fs.writeFileSync(process.argv[3], new Uint8Array(buffer));
});