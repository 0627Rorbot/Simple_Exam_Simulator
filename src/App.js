import './App.css';
import React from 'react';
import _ from 'lodash';

function Axis(props) {
  return (
    <div className="block_container">
      {Array.from(Array(props.hyperPeriod).keys()).map((x, index) => (
        <div key={index} className="block_axis" style={{ width: 100 / props.hyperPeriod + '%' }}>
          {x}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [hyperPeriod, setHyperPeriod] = React.useState(0);
  const [tasks, setTasks] = React.useState([]);
  const [cTime, setCTime] = React.useState('');
  const handleCTime = (event) => setCTime(event.target.value);
  const [period, setPeriod] = React.useState('');
  const handlePeriod = (event) => setPeriod(event.target.value);
  const [deadline, setDeadline] = React.useState('');
  const handleDeadline = (event) => setDeadline(event.target.value);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  const addTask = () => {
    if (!isNaN(cTime) && !isNaN(period) && !isNaN(deadline) && cTime.length > 0 && period.length > 0 && deadline.length > 0) {
      const newTasks = [
        ...tasks,
        {
          cTime: parseInt(cTime),
          period: parseInt(period),
          deadline: parseInt(deadline),
          done: false,
          currentPeriod: 0,
          deadlineUnit: parseInt(deadline),
          executed: 0,
        },
      ];
      setTasks(newTasks);
      setCTime('');
      setPeriod('');
      setDeadline('');
      if (newTasks.length === 1) {
        setHyperPeriod(newTasks[0].period);
      } else {
        setHyperPeriod(newTasks.map((x) => x.period).reduce(lcm));
      }
      document.getElementById('cTime').focus();
    }
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((x, i) => i !== index));
  };

  const clean = () => {
    setTasks([]);
    setCTime('');
    setPeriod('');
    setDeadline('');
    setHyperPeriod(0);
  };

  const gcd = (a, b) => (a ? gcd(b % a, a) : b);
  const lcm = (a, b) => (a * b) / gcd(a, b);

  const objDifference = (object, base) => {
    function changes(object, base) {
      return _.transform(object, function (result, value, key) {
        if (!_.isEqual(value, base[key])) {
          result[key] = _.isObject(value) && _.isObject(base[key]) ? changes(value, base[key]) : value;
        }
      });
    }
    return changes(object, base);
  };

  const randomColor = () => {
    const rangeSize = 100;
    const parts = [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * rangeSize),
      Math.floor(Math.random() * rangeSize) + 256 - rangeSize,
    ].sort((a, b) => Math.random() < 0.5);

    return '#' + parts.map((p) => ('0' + p.toString(16)).substr(-2)).join('');
  };

  const isLLSchedulable = () =>
    tasks.map((x) => x.cTime / x.period).reduce((sum, x) => sum + x) <= tasks.length * (Math.pow(2, 1 / tasks.length) - 1);

  const isHBSchedulable = () => tasks.map((x) => x.cTime / x.period + 1).reduce((prod, x) => prod * x) <= 2;

  const RM = () => {
    const intervals = loadRM(JSON.parse(JSON.stringify(tasks)));
    plotIntervals(intervals);
  };

  const loadRM = (tasks) => {
    tasks.forEach((task, index) => {
      task.deadline = task.period;
      task.deadlineUnit = task.period;
    });
    const intervals = [{ tasks: JSON.parse(JSON.stringify(tasks)) }];

    Array.from(Array(hyperPeriod).keys()).forEach((index) => {
      tasks.forEach((task, i) => {
        if ((task.currentPeriod + 1) * task.period === index && !task.done && task.cTime !== task.executed) {
          alert(`Task ${i} not completed before period`);
        } else {
          if (task.cTime === task.executed) {
            task.executed = 0;
            task.done = true;
          }
          if ((task.currentPeriod + 1) * task.period === index) {
            task.done = false;
            task.currentPeriod++;
          }
        }
      });

      let currentTaskIndex = -1;
      tasks.forEach((task, i) => {
        if (currentTaskIndex > -1) {
          currentTaskIndex = !task.done && task.period < tasks[currentTaskIndex].period ? i : currentTaskIndex;
        } else {
          currentTaskIndex = task.done ? -1 : i;
        }
      });
      if (currentTaskIndex > -1) tasks[currentTaskIndex].executed++;
      intervals.push({ tasks: JSON.parse(JSON.stringify(tasks)) });
    });
    return intervals;
  };

  const DM = () => {
    const intervals = loadDM(JSON.parse(JSON.stringify(tasks)));
    plotIntervals(intervals);
  };

  const loadDM = (tasks) => {
    const intervals = [{ tasks: JSON.parse(JSON.stringify(tasks)) }];

    Array.from(Array(hyperPeriod).keys()).forEach((index) => {
      tasks.forEach((task, i) => {
        if (task.deadline === index && !task.done && task.cTime !== task.executed) {
          alert(`Task ${i} not completed before deadline`);
        } else {
          if (task.cTime === task.executed) {
            task.executed = 0;
            task.done = true;
          }
          if (task.deadline === index) {
            task.deadline = (task.currentPeriod + 1) * task.period + task.deadlineUnit;
          }
          if ((task.currentPeriod + 1) * task.period === index) {
            task.done = false;
            task.currentPeriod++;
          }
        }
      });

      let currentTaskIndex = -1;
      tasks.forEach((task, i) => {
        if (currentTaskIndex > -1) {
          currentTaskIndex = !task.done && task.deadlineUnit < tasks[currentTaskIndex].deadlineUnit ? i : currentTaskIndex;
        } else {
          currentTaskIndex = task.done ? -1 : i;
        }
      });
      if (currentTaskIndex > -1) tasks[currentTaskIndex].executed++;
      intervals.push({ tasks: JSON.parse(JSON.stringify(tasks)) });
    });
    return intervals;
  };

  const EDF = () => {
    const intervals = loadEDF(JSON.parse(JSON.stringify(tasks)));
    plotIntervals(intervals);
  };

  const loadEDF = (tasks) => {
    const intervals = [{ tasks: JSON.parse(JSON.stringify(tasks)) }];

    Array.from(Array(hyperPeriod).keys()).forEach((index) => {
      tasks.forEach((task, i) => {
        if (task.deadline === index && !task.done && task.cTime !== task.executed) {
          alert(`Task ${i} not completed before deadline`);
        } else {
          if (task.cTime === task.executed) {
            task.executed = 0;
            task.done = true;
          }
          if (task.deadline === index) {
            task.deadline = (task.currentPeriod + 1) * task.period + task.deadlineUnit;
          }
          if ((task.currentPeriod + 1) * task.period === index) {
            task.done = false;
            task.currentPeriod++;
          }
        }
      });

      let currentTaskIndex = -1;
      tasks.forEach((task, i) => {
        if (currentTaskIndex > -1) {
          currentTaskIndex = !task.done && task.deadline - index < tasks[currentTaskIndex].deadline - index ? i : currentTaskIndex;
        } else {
          currentTaskIndex = task.done ? -1 : i;
        }
      });
      if (currentTaskIndex > -1) tasks[currentTaskIndex].executed++;
      intervals.push({ tasks: JSON.parse(JSON.stringify(tasks)) });
    });

    return intervals;
  };

  const plotIntervals = (intervals) => {
    const colors = [];
    tasks.forEach((task, index) => {
      document.getElementById(`task_${index}`).innerHTML = '';
      colors.push(randomColor());
    });
    intervals.forEach((interval, index) => {
      if (intervals[index + 1]) {
        let addExecToIndex = -1;
        interval.tasks.forEach((task, i) => {
          const difference = objDifference(intervals[index + 1].tasks[i], task);
          if (Object.keys(difference).length > 0) {
            if (difference.deadline) {
              document.getElementById(`task_${i}`).lastElementChild.classList.add('deadline');
            }
            if (difference.currentPeriod) {
              document.getElementById(`task_${i}`).lastElementChild.classList.add('period');
            }
            if (difference.executed) {
              addExecToIndex = i;
            }
          }
        });
        if (addExecToIndex > -1) {
          const newDiv = document.createElement('div');
          newDiv.style.background = 'linear-gradient(180deg, white 50%, ' + colors[addExecToIndex] + ' 50%)';
          newDiv.style.width = 100 / hyperPeriod + '%';
          newDiv.style.height = '50px';
          document.getElementById(`task_${addExecToIndex}`).appendChild(newDiv);
          tasks.forEach((t, j) => {
            if (addExecToIndex !== j) {
              const otherDiv = document.createElement('div');
              otherDiv.style.background = 'white';
              otherDiv.style.width = 100 / hyperPeriod + '%';
              otherDiv.style.height = '50px';
              document.getElementById(`task_${j}`).appendChild(otherDiv);
            }
          });
        } else {
          tasks.forEach((t, j) => {
            const otherDiv = document.createElement('div');
            otherDiv.style.background = 'white';
            otherDiv.style.width = 100 / hyperPeriod + '%';
            otherDiv.style.height = '50px';
            document.getElementById(`task_${j}`).appendChild(otherDiv);
          });
        }
      }
    });
  };

  return (
    <div>
      <div className="m-3">
        <h1 className="mb-3">Scheduling</h1>
        <div className="input-group mb-3">
          <div className="input-group-prepend">
            <span htmlFor="cTime" className="input-group-text" id="basic-addon3">
              Computational Time:
            </span>
          </div>
          <input type="number" className="form-control" onChange={handleCTime} value={cTime} id="cTime" />
        </div>
        <div className="input-group mb-3">
          <div className="input-group-prepend">
            <span htmlFor="period" className="input-group-text" id="basic-addon3">
              Period:
            </span>
          </div>
          <input type="number" className="form-control" onChange={handlePeriod} value={period} id="period" />
        </div>
        <div className="input-group mb-3">
          <div className="input-group-prepend">
            <span htmlFor="deadline" className="input-group-text" id="basic-addon3">
              Deadline:
            </span>
          </div>
          <input type="number" className="form-control" onKeyUp={handleKeyDown} onChange={handleDeadline} value={deadline} id="deadline" />
        </div>
      </div>
      <div className="mt-3 d-flex justify-content-around">
        <button className="btn btn-danger flex-grow-1 m-3" onClick={clean}>
          Clean
        </button>
        <button className="btn btn-primary flex-grow-1 m-3" onClick={addTask}>
          Add
        </button>
      </div>
      <div className="d-flex justify-content-around">
        <button className="btn btn-primary m-3" onClick={RM}>
          Rate Monotonic
        </button>
        <button className="btn btn-primary m-3" onClick={DM}>
          Deadline Monotonic
        </button>
        <button className="btn btn-primary m-3" onClick={EDF}>
          Earliest Deadline First
        </button>
      </div>
      <div className="m-3">
        {tasks.map((x, index) => (
          <div key={index} className="d-flex align-items-center justify-content-between mb-3">
            <h4>
              <b>Task {index + 1}:</b> C={x.cTime}, T={x.period}, D={x.deadline}
            </h4>
            <button className="btn btn-danger" onClick={() => removeTask(index)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="m-3">
        <h2 className="mb-3">Results</h2>
        {tasks.map((x, index) => (
          <div key={index}>
            <p className="mt-3 mb-0">T {index + 1}</p>
            <div className="block_container" id={'task_' + index}></div>
            <Axis hyperPeriod={hyperPeriod}></Axis>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
