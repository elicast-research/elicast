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

      <button class="btn btn-sm btn-light"
              v-show="playMode.isRecording() && playModeReady"
              @click="toggleRecordExercise">
        <span v-show="playMode === PlayMode.RECORD" class="text-danger">EX_START</span>
        <span v-show="playMode === PlayMode.RECORD_EXERCISE" class="text-danger">EX_STOP</span>
      </button>
    </div>

    <div class="controls">
      <button ref="controlButton"
              class="btn btn-sm btn-light"
              @click="togglePlayMode"
              :disabled="playMode === PlayMode.RECORD_EXERCISE || !playModeReady">
        <i v-show="playMode === PlayMode.PAUSE" class="fa fa-play" aria-hidden="true"></i>
        <i v-show="playMode === PlayMode.PLAYBACK" class="fa fa-pause" aria-hidden="true"></i>
        <i v-show="playMode === PlayMode.STANDBY" class="fa fa-video-camera" aria-hidden="true"></i>
        <i v-show="playMode.isRecording()" class="fa fa-video-camera text-danger" aria-hidden="true"></i>
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
.editor-wrap {
  position: relative;
  border: 1px solid #eee;

  button {
    position: absolute;
    top: .5rem;
    right: .5rem;
    z-index: 100;
    cursor: pointer;
  }
}

.CodeMirror {
  $readonlyBackgroundColor: rgba(0, 0, 0, 0.066);

  font-family: Menlo, Consolas, 'DejaVu Sans Mono', monospace;

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
    background-color: $readonlyBackgroundColor;
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
