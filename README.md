# Elicast

> Elicast: Embedding Interactive Exercises in Instructional Programming Screencasts (L@S '18)
https://dl.acm.org/citation.cfm?id=3231657

A screencast tool for recording and viewing programming lectures with embedded programming exercises, to provide hands-on programming experiences in the screencast.

<p align="center"><img alt="intro.gif" src="https://raw.githubusercontent.com/elicast-research/elicast/master/imgs/intro.gif" width="60%"></p>

If you use this code for academic purposes, please cite it as:

```
@inproceedings{park2018elicast,
  title={Elicast: embedding interactive exercises in instructional programming screencasts},
  author={Park, Jungkook and Park, Yeong Hoon and Kim, Jinhan and Cha, Jeongmin and Kim, Suin and Oh, Alice},
  booktitle={Proceedings of the Fifth Annual ACM Conference on Learning at Scale},
  pages={58},
  year={2018},
  organization={ACM}
}
```

## Key Features

### Text-based Programming Screencast

<p align="center"><img alt="text-based_screencast.png" src="https://raw.githubusercontent.com/elicast-research/elicast/master/imgs/text-based_screencast.png" width="60%"></p>

Text-based programming screencast is the first core feature of Elicast. To overcome the limitation on interactions between learners and the content of screencast, when the instructors record screencasts, Elicast captures instructors' keyboard activities instead of screen captures. Then, when learners play the recorded screencast, Elicast reconstruct keyboard activities to build a video-like view. With this feature, Elicast allows users to select and edit the code content in the screencasts.

### Embedded Interactive Exercise

<p align="center"><img alt="embedded_exercise.png" src="https://raw.githubusercontent.com/elicast-research/elicast/master/imgs/embedded_exercise.png" width="60%"></p>

To provide hands-on programming experience for learners, Elicast allows instructors to embed programming exercises in
the screencast. Elicast allows instructors to make a specific region of the screencast as "quiz region", which make users to write any programming codes in that region. 

### Assertion-based Automated Assessment

![auto_assess.png](https://raw.githubusercontent.com/elicast-research/elicast/master/imgs/auto_assess.png)

Elicast gives immediate assessment results upon learners' submission to the exercises. Namely, Elicast evaluates the functionality of the submitted code by testing whether the student's code performs the same functionality as the instructor's model solution that appears later in the screencast.

## How to Use

### Build Setup

``` bash
# install dependencies
yarn

# serve with hot reload at localhost:8080
yarn run dev

# build for production with minification
yarn run build

# run unit tests
yarn run unit
```

### Connect to the backend

Elicast has a dependency on the backend project [elicast-server](https://github.com/elicast-research/elicast-server) which is used to manage lectures and run programming codes. Please refer to the instruction of eliceast-server, and properly set-up the variable `ELICAST_ENDPOINT` defined at `config/prod.env/js`.