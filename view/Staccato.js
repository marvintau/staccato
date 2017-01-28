import React from 'react';
import ReactDOM from 'react-dom';

import { Row, Col, Button } from 'react-bootstrap';

import {parse} from './StaccatoParser.pegjs';

import scoreText from '../What_A_Friend.txt';

let Elem = function(component, param, children){
    return React.createElement(component, param, children)
}

let SectionElem = function(sectionName, key, children){
    return Elem('div', {
        key : key,
        id : sectionName,
        className : sectionName
    }, children)
}

let Draw = function(component, param, children, to){
    ReactDOM.render( Elem(component, param, children), document.getElementById(to))
}

let GroupByLength = function(notes, length) {
    let initial = [[]];
    let duration = 0;

    return notes.reduce(function(measures, note){
        if (duration < length) {
            measures[measures.length - 1].push(note);
            duration += note.duration;
        } else {
            measures.push([note]);
            duration = note.duration;
        }
        return measures;
    }, initial);
}


class Score extends React.Component{
    constructor(props){
        super(props);
    }

    MeasureElems(){

        let extendedMeasures = []

        this.props.measures.forEach(function(note){
            if(note.duration > 1){
                extendedMeasures.push({pitch: note.pitch, duration: 1});
                for(let i = 1; i < note.duration; i++){
                    extendedMeasures.push({pitch: "-", duration : 1})
                }
            } else {
                extendedMeasures.push(note);
            }
        });

        return GroupByLength(extendedMeasures, 4).map((measure,index) =>Elem(Measure, {measure: measure, key:index}));
    }

    render() {
        return Elem('div', {className:"score"}, this.MeasureElems());
    }
}

class Measure extends React.Component{
    constructor(props){
        super(props);
    }

    BeatElems(){
        return GroupByLength(this.props.measure, 1).map((beat, index)=>Elem(Beat, {beat:beat, key:index}));
    }

    render() {
        return Elem('div', {className:"measure"}, this.BeatElems());
    }

    componentDidMount(){
        // (this.props.children.map(elem => elem.props.children.map(elem => console.log(ReactDOM.findDOMNode(elem)))));
    }
}

class Beat extends React.Component{
    constructor(props){
        super(props);
    }

    NoteElems(){
        return this.props.beat.map((note, index)=>Elem(Note, {ref:"note", key:index, note:note}));
    }

    render() {
        return Elem('span', {className: "beat"}, this.NoteElems());
    }

    componentDidMount(){
        console.log(this.refs);
    }

}

class Note extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            left  : 0,
            right : 0
        }
    }

    render(){
        return Elem('span', {ref:"note", className:"note"}, this.props.note.pitch);
    }

    componentDidMount(){
        var elemNode = ReactDOM.findDOMNode(this);
        var style = elemNode.getBoundingClientRect();

        this.setState({
            left : style.left,
            right : style.right
        })
    }
}

class Container extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            value: scoreText,
            sections : []
        };
    }

    handleChange(event) {

        let sectionFinder = /\s+(\w+)\s*:\s*\{([^:]*)\}/g;

        let text = event.target.value;

        let model;
        let matched, newSections = [];
        while (matched = sectionFinder.exec(text)){
            newSections.push({name : matched[1], body : matched[2]})
        }

        this.setState((previousState) => ({
            value : text,
            sections : newSections
        }));
    }

    sectionElems(){
        let elems = [];

        for (var i = 0; i < this.state.sections.length; i++) {
            if(this.state.sections[i].name != "score"){
                elems.push(SectionElem(this.state.sections[i].name, i, this.state.sections[i].body));
            } else {

                try {
                    let scoreModel = parse(this.state.sections[i].body);
                    elems.push(
                        SectionElem(this.state.sections[i].name, i, Elem(Score, {measures:scoreModel.measures}))
                    );
                } catch (error){
                    console.log(error);
                    elems.push(
                        SectionElem(this.state.sections[i].name, i, Elem(Score, {}, [this.state.sections[i].body]))
                    );
                }

            }

        }

        return elems;
    }


    render() {

        const editor = Elem('textarea', {
            id        : 'editor',
            className : 'editing',
            rows      : 20,
            placeholder : 'yep',
            spellCheck  : 'false',
            value       : this.state.value,
            onChange    : (event) => this.handleChange(event)
        })

        const editorWrapper = Elem(Col, {
            key : 'editor',
            md  :  4,
            className:"editing-wrapper"
        }, editor)

        let preview = Elem(Col, {
            key : 'viewer',
            md  :  6,
            id  : 'preview',
            className:'preview',
        }, Elem('div', {id:'page', className:'page'}, this.sectionElems()))

        const row = Elem(Row, {},
            [editorWrapper, preview]
        );

        return row
    }
}

Draw(Container, {}, "null", 'container');
