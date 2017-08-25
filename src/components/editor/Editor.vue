<template>
  <div id="editor">
    <div class="editor-wrap">
      <codemirror ref="cm"
                  v-model="code"
                  :class="{ 'recording-exercise': recordExerciseInitiated }"
                  :options="editorOptions"
                  @beforeChange="handleEditorBeforeChange"
                  @change="handleEditorChange"
                  @cursorActivity="handleEditorCursorActivity">
      </codemirror>

      <div class="editor-right-pane">
        <div class="record-controls"
             v-show="playMode.isRecording()">
         <button class="run-code-button btn btn-sm btn-light"
                 :disabled="!playModeReady">
            <i class="fa fa-terminal"></i> Run
          </button>

          <button class="btn btn-sm btn-light"
                  @click="toggleRecordExercise"
                  :disabled="!playModeReady">

            <span v-show="playMode === PlayMode.RECORD">
              <i class="fa fa-pencil-square-o"></i> Record Exercise
            </span>
            <span v-show="playMode === PlayMode.RECORD_EXERCISE">
              <i class="fa fa-pencil-square-o"></i> End Exercise Recording
            </span>
          </button>
        </div>

        <Resizable class="card code-run-output-card">
          <div class="card-header px-3 py-2">
            Output
          </div>
          <div class="code-run-output card-body px-3 py-2">
          </div>
          <svg class="resize-handle"
               xmlns="http://www.w3.org/2000/svg"
               width="10px" height="10px" viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke-width="1"></line>
            <line x1="0" y1="4" x2="6" y2="10" stroke-width="1"></line>
          </svg>
        </Resizable>

      </div>
    </div>

    <div class="controls">
      <button ref="controlButton"
              class="btn btn-sm btn-light"
              @click="togglePlayMode"
              :disabled="playMode === PlayMode.RECORD_EXERCISE || !playModeReady">
        <i v-show="playMode === PlayMode.PAUSE" class="fa fa-play"></i>
        <i v-show="playMode === PlayMode.PLAYBACK" class="fa fa-pause"></i>
        <i v-show="playMode === PlayMode.STANDBY" class="fa fa-video-camera"></i>
        <i v-show="playMode.isRecording()" class="fa fa-video-camera text-danger"></i>
      </button>

      <Slider ref="slider"
              class="slider"
              @change="handleSliderChange"
              :color="sliderColor"
              :disabled="playMode.isRecording()"></Slider>

      <div class="ts-display text-secondary">
        {{ tsDisplay }}
      </div>
    </div>
  </div>
</template>

<script src="./Editor.js"></script>

<style lang="scss">

$codeFontFamily: Menlo, Consolas, 'DejaVu Sans Mono', monospace;

.editor-wrap {
  position: relative;
  border: 1px solid #eee;
  overflow: hidden;

  .editor-right-pane {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 100;
    max-width: percentage(1 - 0.618);
    max-height: 100%;

    & > * {
      margin: .5rem;
    }

    .record-controls {
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      justify-content: flex-end;

      & > * {
        margin: 0 0.25rem;

        &:last-child {
          margin-right: 0;
        }
      }

      button {
        cursor: pointer;

        background-color: transparentize(red, .925);
        border-color: transparent;

        &:hover {
          background-color: transparentize(red, 0.85);
          border-color: transparentize(red, 0.85);
        }
      }
    }

    .code-run-output-card {
      $outputFontSize: .875rem;
      $lineHeight: 1.5;

      font-size: .875rem;
      min-width: 15em;
      max-width: fill-available;
      min-height: $outputFontSize * $lineHeight * 7;
      max-height: $outputFontSize * $lineHeight * 12;

      background-color: rgba(255, 255, 255, 0.7);

      .code-run-output {
        overflow: scroll;
        font-size: $outputFontSize;
        font-family: $codeFontFamily;
        line-height: $lineHeight;
      }

      .resize-handle {
        position: absolute;
        left: 0;
        bottom: 0;
        line-height: 0;
        cursor: sw-resize;

        line {
          stroke: rgba(0, 0, 0, .125);
        }
      }
    }
  }
}

.CodeMirror {
  $readonlyBackgroundColor: rgba(0, 0, 0, 0.066);
  $exerciseBackgroundColor: transparentize(#E1BEE7, 0.5);

  font-family: $codeFontFamily;

  .recording-exercise ~ & {
    background-color: $readonlyBackgroundColor;
  }

  .recording-exercise-block {
    padding: .2em 0;
    border-radius: .2em;
    background-color: white;
  }

  .exercise-block {
    padding: .15em 0;
    border-radius: .1em;
    background-color: $exerciseBackgroundColor;
    cursor: pointer;
  }
}

.controls {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;

  & > * {
    margin: 0 0.25rem;

    &:first-child, &:last-child {
      margin: 0;
    }
  }

  button {
    width: 2.5em;
    text-align: center;
    cursor: pointer;
  }

  .slider {
    flex: auto;
  }

  .ts-display {
    width: 2rem;
    text-align: center;
    font-size: 0.7rem;
  }
}
</style>
