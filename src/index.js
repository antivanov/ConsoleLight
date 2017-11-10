import { h, app } from 'hyperapp';
import 'app.css';
import 'foundation-icons/foundation-icons.css';
import CodeEditor from 'editor';
import Evaluator from 'evaluator';
import Button from 'widgets/button';
import { LogLevel, extendBrowserConsole } from 'logger';
import 'utils/array';

const evaluator = new Evaluator();

const SingleEvaluationResult = ({ value }) => {
  const { level, datum } = value;

  let formattedDataLines;

  if (typeof datum === 'string') {
    formattedDataLines = datum.split('\n');
  } else if (Object.prototype.toString.call(datum) === '[object Array]') {
    formattedDataLines = [`[ ${datum.join(', ')} ]`];
  } else {
    formattedDataLines = ['' + JSON.stringify(datum, null, 2)];
  }

  const className = `single-evaluation-result single-evaluation-result-${level}`;

  return (<p class={className}>{formattedDataLines.map(formattedDataLine =>
      <pre>{formattedDataLine}</pre>
    )}</p>);
};

const EvaluationResults = ({ evaluationResults }) => {

  const scrollToBottom = element => {
    setTimeout(() => {
      element.scrollTop = element.scrollHeight;
    }, 100);
  };

  return (<section
    class="evaluation-results"
    updateWhenChanges={evaluationResults.length}
    onupdate={scrollToBottom}
    >
    {evaluationResults.flatMap(result =>
      result.data.map(datum => {
        const value = {
          level: result.level,
          datum: datum
        };
        return <SingleEvaluationResult value={value} />;
      })
    )}
  </section>);
};

const emit = app({
  state: {
    codeToEvaluate: '',
    evaluationResults: []
  },
  view: (state, actions) => 
    (<section class="app-container">
      <section class="editing-area">
        <CodeEditor code={state.codeToEvaluate} onkeyup={actions.updateCode}></CodeEditor>
        <section class="editing-area-buttons">
          <Button iconName="play" tooltip="Run" onclick={actions.evaluate}></Button>
          <Button iconName="prohibited" tooltip="Clear" onclick={actions.clear}></Button>
          <Button iconName="trash" tooltip="Erase context" onclick={actions.eraseContext}></Button>
        </section>
      </section>
      <EvaluationResults evaluationResults={state.evaluationResults} />
    </section>),
  actions: {
    evaluate: (state, actions) => {
      const { evaluationResults, codeToEvaluate } = state;

      try {
        const currentEvaluationResult = evaluator.evaluate(codeToEvaluate);

        actions.log({
          data: [ currentEvaluationResult ]
        });
      } catch (evaluationError) {
        actions.log({
          level: LogLevel.ERROR,
          data: [ evaluationError.stack ]
        });
      }
    },
    clear: (state, actions) => {
      return {
        evaluationResults: []
      };
    },
    eraseContext: () => {
      evaluator.eraseContext();
    },
    updateCode: (state, actions, event) => {
      const editor = event.target.editor;
      const codeToEvaluate = editor.getValue();

      return {
        codeToEvaluate
      };
    },
    log: (state, actions, {level = LogLevel.LOG, data}) => {
      const { evaluationResults } = state;

      return {
        evaluationResults: evaluationResults.slice().concat([{
          level,
          data
        }])
      };
    }
  },
  events: {
    log: (state, actions, {level, data}) => {
      actions.log({level, data});
    }
  }
});

extendBrowserConsole(emit);