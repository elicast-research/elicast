<template>
  <div id="player">
    <div>
      <span class="elicast-title">{{ elicastTitle }}</span>
    </div>

    <div class="code-wrap">
      <codemirror ref="cm"
                  v-model="code"
                  :class="{ 'solve-exercise': playMode === PlayMode.SOLVE_EXERCISE }"
                  :options="editorOptions"
                  @beforeChange="handleEditorBeforeChange"
                  @change="handleEditorChange"
                  @beforeSelectionChange="handleEditorBeforeSelectionChange">
                  <!-- @cursorActivity="handleEditorCursorActivity"> -->
      </codemirror>

      <div class="code-right-pane">
        <div class="pause-controls code-right-pane-controls"
             v-show="playMode === PlayMode.PAUSE">
          <button class="run-code-button btn btn-sm btn-light"
                 :disabled="!playModeReady"
                 @click="runCode">
            <i class="fa fa-terminal"></i> Run
          </button>
        </div>

        <div class="solve-control code-right-pane-controls"
             v-show="playMode === PlayMode.SOLVE_EXERCISE">
          <button class="run-code-button btn btn-sm btn-primary"
                :disabled="!playModeReady"
                @click="runCode">
            <i class="fa fa-terminal"></i> Run
          </button>
          <button class="check-answer-button btn btn-sm btn-success"
                  :disabled="!playModeReady"
                  @click="checkAnswer">
            <i class="fa fa-pencil"></i> Check Answer
          </button>
          <button class="check-answer-button btn btn-sm btn-light"
                  :disabled="!playModeReady"
                  @click="skipExercise">
            <i class="fa fa-forward"></i> Skip Exercise
          </button>
        </div>

        <RunOutputView :output="runOutput"></RunOutputView>
      </div>
    </div>

    <div class="controls">
      <button ref="controlButton"
              class="btn btn-sm btn-light"
              @click="togglePlayMode"
              :disabled="playMode === PlayMode.SOLVE_EXERCISE || !playModeReady">
        <i v-show="playMode === PlayMode.PAUSE && ts !== maxTs" class="fa fa-play"></i>
        <i v-show="playMode === PlayMode.PLAYBACK" class="fa fa-pause"></i>
        <i v-show="playMode === PlayMode.SOLVE_EXERCISE" class="fa fa-pause"></i>
        <i v-show="playMode === PlayMode.PAUSE && ts === maxTs" class="fa fa-repeat"></i>
      </button>

      <Slider ref="slider"
              class="slider"
              @change="handleSliderChange"
              :max="maxTs"></Slider>

      <div class="ts-display text-secondary">
        {{ tsDisplay }}
      </div>
    </div>
  </div>
</template>

<script src="./Player.js"></script>

<style lang="scss">

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

.CodeMirror {
  $readonlyBackgroundColor: rgba(0, 0, 0, 0.066);

  .solve-exercise ~ & {
    background-color: $readonlyBackgroundColor;
  }

  .solve-exercise-block {
    padding: .2em 0;
    border-radius: .2em;
    background-color: white;
  }
}

.ts-display {
  width: 3.8rem;
}

</style>
