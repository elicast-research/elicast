<template>
  <div id="player">
    <div>
      <span v-show="elicastId !== null">(ID-{{ elicastId }})</span>
      <span class="elicast-title">{{ elicastTitle }}</span>
    </div>

    <div class="code-wrap">
      <codemirror ref="cm"
                  v-model="code"
                  :class="{ 'solve-exercise': playMode === PlayMode.SOLVE_EXERCISE }"
                  :options="editorOptions">
      </codemirror>

      <div class="code-right-pane">
        <div class="pause-controls"
             v-show="playMode === PlayMode.PAUSE">
         <button class="run-code-button btn btn-sm btn-light"
                 :disabled="!playModeReady"
                 @click="runCode">
            <i class="fa fa-terminal"></i> Run
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
        <i v-show="playMode === PlayMode.PAUSE && ts === maxTs" class="fa fa-repeat"></i>
      </button>

      <Slider ref="slider"
              class="slider"
              @change="handleSliderChange"
              :max="maxTs"
              :disabled="playMode === PlayMode.SOLVE_EXERCISE"></Slider>

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

.pause-controls {
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

    border: 1px solid rgba(0, 0, 0, 0.125);
  }
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
  width: 3.4rem;
}

</style>
