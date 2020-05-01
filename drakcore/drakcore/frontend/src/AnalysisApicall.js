import React from "react";
import { Component } from "react";
import "./App.css";
import api from "./api";

class ProcessFilter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: this.props.defaultSelection,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    let value = event.target.value;
    this.setState({ selected: value });
    this.props.onChange(parseInt(value));
  }

  render() {
    return (
      <select
        value={this.state.selected || ""}
        className="form-control"
        onChange={this.handleChange}
        style={this.props.style}
      >
        {this.props.processList.map((proc) => {
          let pid = proc.pid;
          let name = proc.procname || "unnamed process";
          return (
            <option key={pid} value={pid}>
              {pid} - {name}
            </option>
          );
        })}
      </select>
    );
  }
}

class AnalysisApicall extends Component {
  constructor(props) {
    super(props);
    const pid = parseInt(this.props.match.params.pid);

    this.state = {
      calls: [],
      pidFilter: pid,
      processList: [],
    };
  }

  async componentDidMount() {
    const analysis = this.props.match.params.analysis;
    const process_tree = await api.getProcessTree(analysis);

    function treeFlatten(process_tree) {
      let result = [];

      process_tree.forEach((proc) => {
        result.push({ pid: proc.pid, procname: proc.procname });
        result.push(...treeFlatten(proc.children));
      });

      result.sort((a, b) => a.pid - b.pid);

      return result;
    }

    if (process_tree) {
      this.setState({ processList: treeFlatten(process_tree.data) });
    }

    const calls = await api.getApiCalls(analysis);
    if (calls) {
      this.setState({ calls: calls.data || [] });
    }
  }

  render() {
    let filteredCalls = this.state.calls.filter(
      (entry) => entry.pid === this.state.pidFilter
    );
    let tableContent = filteredCalls.map((entry, i) => (
      <tr key={i}>
        <td style={{ padding: "0.5rem" }}>{entry.timestamp}</td>
        <td style={{ padding: "0.5rem" }}>
          <code>{entry.method}</code>
        </td>
        <td style={{ padding: "0.5rem" }}>
          {entry.arguments.map((arg, i) => (
            <div key={i} className="badge-outline-primary badge mr-2">
              {arg}
            </div>
          ))}
        </td>
      </tr>
    ));

    let content;
    if (tableContent.length === 0) {
      content = (
        <div class="alert alert-primary" role="alert">
          No API calls found for this process
        </div>
      );
    } else {
      content = (
        <table className="table table-centered mb-0">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Method</th>
              <th>Arguments</th>
            </tr>
          </thead>
          <tbody>{tableContent}</tbody>
        </table>
      );
    }

    return (
      <div className="App container-fluid">
        <div className="page-title-box">
          <h4 className="page-title">API calls</h4>
        </div>

        <div className="card tilebox-one">
          <div className="card-body">
            <ProcessFilter
              defaultSelection={this.state.pidFilter}
              processList={this.state.processList}
              onChange={(pid) => this.setState({ pidFilter: pid })}
              style={{ marginBottom: "1em" }}
            />
            {content}
          </div>
        </div>
      </div>
    );
  }
}

export default AnalysisApicall;
