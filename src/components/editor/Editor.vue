<template>
  <div id="editor">
    <div>
      <span v-show="elicastId !== null">(ID-{{ elicastId }})</span>
      <input class="elicast-title" v-model.trim="elicastTitle">
    </div>
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
                 :disabled="!playModeReady"
                 @click="runCode"
                 >
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

        <RunOutputView :output="runOutput"></RunOutputView>
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

.elicast-title {
  max-width: 100%;
  margin: 0;
  padding: 0;
  outline: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: none;
  border: none;
  box-shadow: none;
  display: inline-block;
  font-size: 2rem;
  width: 100%;
}

.editor-wrap {
  position: relative;
  border: 1px solid #eee;
  overflow: hidden;
  margin-top: 1rem;

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
