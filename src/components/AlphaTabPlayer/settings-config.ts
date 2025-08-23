/* eslint-disable @typescript-eslint/no-explicit-any */
import * as alphaTab from '@coderline/alphatab';

export interface SettingsContextProps {
  api: alphaTab.AlphaTabApi;
  onSettingsUpdated: () => void;
}

export interface UpdateSettingsOptions {
  callRender?: boolean;
  callUpdateSettings?: boolean;
  afterUpdate?: (context: SettingsContextProps) => void;
}

export interface SettingControl {
  type: 'number-range' | 'number-input' | 'boolean-toggle' | 'enum-dropdown' | 'button-group' | 'color-picker' | 'font-picker';
  min?: number;
  max?: number;
  step?: number;
  enumType?: any;
  options?: Array<{ label: string; value: any }>;
}

export interface SettingSchema {
  label: string;
  getValue: (context: SettingsContextProps) => any;
  setValue: (context: SettingsContextProps, value: any) => void;
  control: SettingControl;
}

export interface SettingsGroupSchema {
  title: string;
  settings: SettingSchema[];
}

function updateSettings(
  context: SettingsContextProps, 
  setter: (settings: alphaTab.Settings) => void,
  options: UpdateSettingsOptions = { callRender: true, callUpdateSettings: true }
) {
  setter(context.api.settings);
  
  if (options.callUpdateSettings !== false) {
    context.api.updateSettings();
  }
  
  if (options.callRender !== false) {
    context.api.render();
  }
  
  if (options.afterUpdate) {
    options.afterUpdate(context);
  }
  
  context.onSettingsUpdated();
}

class SettingsFactory {
  numberRange(
    label: string,
    settingPath: string,
    min: number,
    max: number,
    step: number,
    options?: UpdateSettingsOptions
  ): SettingSchema {
    return {
      label,
      getValue: (context) => this.getNestedValue(context.api.settings, settingPath),
      setValue: (context, value) => {
        updateSettings(context, (s) => this.setNestedValue(s, settingPath, value), options);
      },
      control: { type: 'number-range', min, max, step }
    };
  }

  numberInput(
    label: string,
    settingPath: string,
    min?: number,
    max?: number,
    step?: number,
    options?: UpdateSettingsOptions
  ): SettingSchema {
    return {
      label,
      getValue: (context) => this.getNestedValue(context.api.settings, settingPath),
      setValue: (context, value) => {
        updateSettings(context, (s) => this.setNestedValue(s, settingPath, value), options);
      },
      control: { type: 'number-input', min, max, step }
    };
  }

  toggle(label: string, settingPath: string, options?: UpdateSettingsOptions): SettingSchema {
    return {
      label,
      getValue: (context) => this.getNestedValue(context.api.settings, settingPath),
      setValue: (context, value) => {
        updateSettings(context, (s) => this.setNestedValue(s, settingPath, value), options);
      },
      control: { type: 'boolean-toggle' }
    };
  }

  enumDropDown(
    label: string,
    settingPath: string,
    enumType: any,
    options?: UpdateSettingsOptions
  ): SettingSchema {
    return {
      label,
      getValue: (context) => this.getNestedValue(context.api.settings, settingPath),
      setValue: (context, value) => {
        updateSettings(context, (s) => this.setNestedValue(s, settingPath, value), options);
      },
      control: { type: 'enum-dropdown', enumType }
    };
  }

  buttonGroup(
    label: string,
    settingPath: string,
    options: Array<[string, any]>,
    updateOptions?: UpdateSettingsOptions
  ): SettingSchema {
    return {
      label,
      getValue: (context) => this.getNestedValue(context.api.settings, settingPath),
      setValue: (context, value) => {
        updateSettings(context, (s) => this.setNestedValue(s, settingPath, value), updateOptions);
      },
      control: {
        type: 'button-group',
        options: options.map(([label, value]) => ({ label, value }))
      }
    };
  }

  colorPicker(label: string, settingPath: string, options?: UpdateSettingsOptions): SettingSchema {
    return {
      label,
      getValue: (context) => this.getNestedValue(context.api.settings, settingPath),
      setValue: (context, value) => {
        updateSettings(context, (s) => this.setNestedValue(s, settingPath, value), options);
      },
      control: { type: 'color-picker' }
    };
  }

  fontPicker(label: string, settingPath: string, options?: UpdateSettingsOptions): SettingSchema {
    return {
      label,
      getValue: (context) => this.getNestedValue(context.api.settings, settingPath),
      setValue: (context, value) => {
        updateSettings(context, (s) => this.setNestedValue(s, settingPath, value), options);
      },
      control: { type: 'font-picker' }
    };
  }

  apiAccessors(apiProperty: string): Pick<SettingSchema, 'getValue' | 'setValue'> {
    return {
      getValue: (context) => (context.api as any)[apiProperty],
      setValue: (context, value) => {
        (context.api as any)[apiProperty] = value;
        context.onSettingsUpdated();
      }
    };
  }

  stylesheetAccessors(stylesheetProperty: string): Pick<SettingSchema, 'getValue' | 'setValue'> {
    return {
      getValue: (context) => context.api.score?.stylesheet ? (context.api.score.stylesheet as any)[stylesheetProperty] : null,
      setValue: (context, value) => {
        if (context.api.score?.stylesheet) {
          (context.api.score.stylesheet as any)[stylesheetProperty] = value;
          context.onSettingsUpdated();
          context.api.render();
        }
      }
    };
  }

  numberRangeNegativeDisabled(
    label: string,
    settingPath: string,
    min: number,
    max: number,
    step: number,
    options?: UpdateSettingsOptions
  ): SettingSchema {
    return this.numberRange(label, settingPath, min, max, step, options);
  }

  private getNestedValue(obj: any, path: string): any {
    const result = path.split('.').reduce((current, key) => current?.[key], obj);
    return result !== undefined ? result : null;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}

const factory = new SettingsFactory();

export function buildSettingsGroups(): SettingsGroupSchema[] {
  const noRerender: UpdateSettingsOptions = { callRender: false, callUpdateSettings: true };
  const withMidiGenerate: UpdateSettingsOptions = {
    callRender: false,
    callUpdateSettings: false,
    afterUpdate(context) {
      context.api.loadMidiForScore();
    }
  };

  return [
    {
      title: 'Display ▸ General',
      settings: [
        factory.buttonGroup('Render Engine', 'core.engine', [
          ['SVG', 'svg'],
          ['HTML5', 'html5']
        ]),
        factory.numberRange('Scale', 'display.scale', 0.25, 2, 0.25),
        factory.numberRange('Stretch', 'display.stretchForce', 0.25, 2, 0.25),
        factory.enumDropDown('Layout', 'display.layoutMode', alphaTab.LayoutMode),
        factory.numberRangeNegativeDisabled('Bars per System', 'display.barsPerRow', -1, 20, 1),
        factory.numberInput('Start Bar', 'display.startBar', 1, undefined, 1),
        factory.numberInput('Bar Count', 'display.barCount', -1, undefined, 1),
        factory.toggle('Justify Last System', 'display.justifyLastSystem'),
        factory.enumDropDown('Systems Layout Mode', 'display.systemsLayoutMode', alphaTab.SystemsLayoutMode)
      ]
    },
    {
      title: 'Display ▸ Colors',
      settings: [
        factory.colorPicker('Staff Line', 'display.resources.staffLineColor'),
        factory.colorPicker('Bar Separator', 'display.resources.barSeparatorColor'),
        factory.colorPicker('Bar Number', 'display.resources.barNumberColor'),
        factory.colorPicker('Main Glyphs', 'display.resources.mainGlyphColor'),
        factory.colorPicker('Secondary Glyphs', 'display.resources.secondaryGlyphColor'),
        factory.colorPicker('Score Info', 'display.resources.scoreInfoColor')
      ]
    },
    {
      title: 'Display ▸ Fonts',
      settings: [
        factory.fontPicker('Copyright', 'display.resources.copyrightFont'),
        factory.fontPicker('Title', 'display.resources.titleFont'),
        factory.fontPicker('Subtitle', 'display.resources.subTitleFont'),
        factory.fontPicker('Words', 'display.resources.wordsFont'),
        factory.fontPicker('Effects', 'display.resources.effectFont'),
        factory.fontPicker('Timer', 'display.resources.timerFont'),
        factory.fontPicker('Directions', 'display.resources.directionsFont'),
        factory.fontPicker('Fretboard Numbers', 'display.resources.fretboardNumberFont'),
        factory.fontPicker('Numbered Notation', 'display.resources.numberedNotationFont'),
        factory.fontPicker('Guitar Tabs', 'display.resources.tablatureFont'),
        factory.fontPicker('Grace Notes', 'display.resources.graceFont'),
        factory.fontPicker('Bar Numbers', 'display.resources.barNumberFont'),
        factory.fontPicker('Inline Fingering', 'display.resources.inlineFingeringFont'),
        factory.fontPicker('Markers', 'display.resources.markerFont')
      ]
    },
    {
      title: 'Display ▸ Paddings',
      settings: [
        {
          label: 'Horizontal',
          getValue(context: SettingsContextProps) {
            return context.api.settings.display.padding[0];
          },
          setValue(context: SettingsContextProps, value) {
            updateSettings(context, s => {
              s.display.padding[0] = value;
            });
          },
          control: { type: 'number-input', min: 0, step: 1 }
        },
        {
          label: 'Vertical',
          getValue(context: SettingsContextProps) {
            return context.api.settings.display.padding[1];
          },
          setValue(context: SettingsContextProps, value) {
            updateSettings(context, s => {
              s.display.padding[1] = value;
            });
          },
          control: { type: 'number-input', min: 0, step: 1 }
        },
        factory.numberInput('First System Top', 'display.firstSystemPaddingTop', 0),
        factory.numberInput('Other Systems Top', 'display.systemPaddingTop', 0),
        factory.numberInput('Last System Bottom', 'display.lastSystemPaddingBottom', 0),
        factory.numberInput('Other Systems Bottom', 'display.systemPaddingBottom', 0),
        factory.numberInput('System Label Left', 'display.systemLabelPaddingLeft', 0),
        factory.numberInput('System Label Right', 'display.systemLabelPaddingRight', 0),
        factory.numberInput('Accolade Bar Right', 'display.accoladeBarPaddingRight', 0),
        factory.numberInput('Notation Staff Top', 'display.notationStaffPaddingTop', 0),
        factory.numberInput('Notation Staff Bottom', 'display.notationStaffPaddingBottom', 0),
        factory.numberInput('Effect Staff Top', 'display.effectStaffPaddingTop', 0),
        factory.numberInput('Effect Staff Bottom', 'display.effectStaffPaddingBottom', 0),
        factory.numberInput('First Staff Left', 'display.firstStaffPaddingLeft', 0),
        factory.numberInput('Other Staves Left', 'display.staffPaddingLeft', 0)
      ]
    },
    {
      title: 'Notation',
      settings: [
        factory.enumDropDown('Fingering', 'notation.fingeringMode', alphaTab.FingeringMode),
        factory.enumDropDown('Tab Rhythm Stems', 'notation.rhythmMode', alphaTab.TabRhythmMode),
        factory.numberInput('⤷ Height', 'notation.rhythmHeight', 1),
        factory.toggle('Small Grace Notes in Tabs', 'notation.smallGraceTabNotes'),
        factory.toggle('Extend Bend Arrows on Tied Notes', 'notation.extendBendArrowsOnTiedNotes'),
        factory.toggle('Extend Line Effects to Beat End', 'notation.extendLineEffectsToBeatEnd'),
        factory.numberInput('Slur Height', 'notation.slurHeight', 1)
      ]
    },
    {
      title: 'Player',
      settings: [
        {
          label: 'Volume',
          ...factory.apiAccessors('masterVolume'),
          control: { type: 'number-range', min: 0, max: 1, step: 0.1 }
        },
        {
          label: 'Metronome Volume',
          ...factory.apiAccessors('metronomeVolume'),
          control: { type: 'number-range', min: 0, max: 1, step: 0.1 }
        },
        {
          label: 'Count-In Volume',
          ...factory.apiAccessors('countInVolume'),
          control: { type: 'number-range', min: 0, max: 1, step: 0.1 }
        },
        {
          label: 'Playback Speed',
          ...factory.apiAccessors('playbackSpeed'),
          control: { type: 'number-range', min: 0.1, max: 3, step: 0.1 }
        },
        {
          label: 'Looping',
          ...factory.apiAccessors('isLooping'),
          control: { type: 'boolean-toggle' }
        },
        factory.enumDropDown('Player Mode', 'player.playerMode', alphaTab.PlayerMode, noRerender),
        factory.toggle('Show Cursors', 'player.enableCursor', noRerender),
        factory.toggle('Animated Beat Cursor', 'player.enableAnimatedBeatCursor', noRerender),
        factory.toggle('Highlight Notes', 'player.enableElementHighlighting', noRerender),
        factory.toggle('Enable User Interaction', 'player.enableUserInteraction', noRerender),
        factory.numberInput('Scroll Offset X', 'player.scrollOffsetX', undefined, undefined, undefined, noRerender),
        factory.numberInput('Scroll Offset Y', 'player.scrollOffsetY', undefined, undefined, undefined, noRerender),
        factory.enumDropDown('Scroll Mode', 'player.scrollMode', alphaTab.ScrollMode, noRerender),
        factory.numberInput('Song-Book Bend Duration', 'player.songBookBendDuration', 0.1, undefined, 0.1, withMidiGenerate),
        factory.numberInput('Song-Book Dip Duration', 'player.songBookDipDuration', 0.1, undefined, 0.1, withMidiGenerate),
        factory.numberInput('Vibrato Note Wide Length', 'player.vibrato.noteWideLength', 0.1, undefined, 0.1, withMidiGenerate),
        factory.numberInput('Vibrato Note Wide Amplitude', 'player.vibrato.noteWideAmplitude', 0.1, undefined, 0.1, withMidiGenerate),
        factory.numberInput('Vibrato Note Slight Length', 'player.vibrato.noteSlightLength', 0.1, undefined, 0.1, withMidiGenerate),
        factory.numberInput('Vibrato Note Slight Amplitude', 'player.vibrato.noteSlightAmplitude', 0.1, undefined, 0.1, withMidiGenerate),
        factory.numberInput('Vibrato Beat Wide Length', 'player.vibrato.beatWideLength', 0.1, undefined, 0.1),
        factory.numberInput('Vibrato Beat Wide Amplitude', 'player.vibrato.beatWideAmplitude', 0.1, undefined, 0.1, withMidiGenerate),
        factory.numberInput('Vibrato Beat Slight Length', 'player.vibrato.beatSlightLength', 0.1, undefined, 0.1, withMidiGenerate),
        factory.numberInput('Vibrato Beat Slight Amplitude', 'player.vibrato.beatSlightAmplitude', 0.1, undefined, 0.1, withMidiGenerate),
        factory.numberInput('Slide Simple Pitch Offset', 'player.slide.simpleSlidePitchOffset', 1),
        factory.numberInput('Slide Simple Duration Ratio', 'player.slide.simpleSlideDurationRatio', 0.1, 1, 0.1, withMidiGenerate),
        factory.numberInput('Slide Shift Duration Ratio', 'player.slide.shiftSlideDurationRatio', 0.1, 1, 0.1, withMidiGenerate),
        factory.toggle('Play Swing', 'player.playTripletFeel', withMidiGenerate)
      ]
    },
    {
      title: 'Stylesheet',
      settings: [
        {
          label: 'Hide Dynamics',
          ...factory.stylesheetAccessors('hideDynamics'),
          control: { type: 'boolean-toggle' }
        },
        {
          label: 'Bracket Extend Mode',
          ...factory.stylesheetAccessors('bracketExtendMode'),
          control: { type: 'enum-dropdown', enumType: alphaTab.model.BracketExtendMode }
        },
        {
          label: 'System Sign Separator',
          ...factory.stylesheetAccessors('useSystemSignSeparator'),
          control: { type: 'boolean-toggle' }
        },
        {
          label: 'Show Guitar Tuning',
          ...factory.stylesheetAccessors('globalDisplayTuning'),
          control: { type: 'boolean-toggle' }
        },
        {
          label: 'Show Chord Diagrams',
          ...factory.stylesheetAccessors('globalDisplayChordDiagramsOnTop'),
          control: { type: 'boolean-toggle' }
        },
        {
          label: 'Single-Track Name Policy',
          ...factory.stylesheetAccessors('singleTrackTrackNamePolicy'),
          control: { type: 'enum-dropdown', enumType: alphaTab.model.TrackNamePolicy }
        },
        {
          label: 'Multi-Track Name Policy',
          ...factory.stylesheetAccessors('multiTrackTrackNamePolicy'),
          control: { type: 'enum-dropdown', enumType: alphaTab.model.TrackNamePolicy }
        },
        {
          label: 'First System Track Name Format',
          ...factory.stylesheetAccessors('firstSystemTrackNameMode'),
          control: { type: 'enum-dropdown', enumType: alphaTab.model.TrackNameMode }
        },
        {
          label: 'First System Track Name Orientation',
          ...factory.stylesheetAccessors('firstSystemTrackNameOrientation'),
          control: { type: 'enum-dropdown', enumType: alphaTab.model.TrackNameOrientation }
        },
        {
          label: 'Other Systems Track Name Format',
          ...factory.stylesheetAccessors('otherSystemsTrackNameMode'),
          control: { type: 'enum-dropdown', enumType: alphaTab.model.TrackNameMode }
        },
        {
          label: 'Other Systems Track Name Orientation',
          ...factory.stylesheetAccessors('otherSystemsTrackNameOrientation'),
          control: { type: 'enum-dropdown', enumType: alphaTab.model.TrackNameOrientation }
        },
        {
          label: 'Multi-Bar Rests',
          getValue(context: SettingsContextProps) {
            return context.api.score?.stylesheet.multiTrackMultiBarRest || false;
          },
          setValue(context: SettingsContextProps, value) {
            if (context.api.score?.stylesheet) {
              context.api.score.stylesheet.multiTrackMultiBarRest = value;
              if (value) {
                context.api.score.stylesheet.perTrackMultiBarRest = new Set(
                  context.api.score.tracks.map(t => t.index)
                );
              } else {
                context.api.score.stylesheet.perTrackMultiBarRest = null;
              }
              context.onSettingsUpdated();
              context.api.render();
            }
          },
          control: { type: 'boolean-toggle' }
        }
      ]
    }
  ];
}