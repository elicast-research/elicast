from flask import Flask, render_template

app = Flask(__name__)


@app.route('/')
def index_page():
    return render_template('index.html')


@app.route('/elicast_maker')
def elicast_maker_page():
    return render_template('elicast_maker.html')


@app.route('/elicast_viewer')
def eliceast_viewer_page():
    return render_template('eliceast_viewer.html')

if __name__ == '__main__':
    app.run('0.0.0.0', 4321, debug=True, threaded=True)
