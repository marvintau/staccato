import React from 'react';
import ReactDOM from 'react-dom';

import { Row, Col, Button } from 'react-bootstrap';

import {parse} from './StaccatoParser.pegjs';

import scoreText from '../What_A_Friend.txt';

import {default as Sidebar} from 'react-sidebar';


let Elem = function(component, param, children){
    return React.createElement(component, param, children)
}

let SectionElem = function(sectionName, key, children){
    return Elem('div', {
        key : key,
        ref : sectionName,
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

class Vertbar extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return Elem('div', {className:"vertbar"})
    }
}

class Finalbar extends React.Component{
    constructor(props){
        super(props);
    }
    render(){
        return Elem('div', {className:"finalbar"})
    }
}

class Underbar extends React.Component{
    constructor(props){
        super(props);
    }

    render(){

        let style = {
            left:this.props.left,
            width:this.props.width,
            top :this.props.top
        }

        return Elem('div', {style:style, className:"underbar"})
    }
}

class Measure extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            measure : GroupByLength(this.props.measure, 1)
        }
    }

    BeatElems(){
        return this.state.measure.map((beat, index)=>Elem(Beat, {ref:index, beat:beat, key:index}));
    }

    render() {
        return Elem('div', {className:"measure"}, this.BeatElems());
    }

    componentDidMount(){

    }
}

class Beat extends React.Component{
    constructor(props){
        super(props);
    }

    NoteElems(){
        return this.props.beat.map((note, index)=>Elem(Note, {ref:index, key:index, note:note}));
    }

    render() {
        return Elem('span', {className: "beat"}, this.NoteElems());
    }

    componentDidMount(){
    }

}

class Note extends React.Component{
    constructor(props){
        super(props);
        this.box = { left  : 0, right : 0 }
    }

    render(){
        return Elem('span', {ref:"note", className:"note"}, this.props.note.pitch + (this.props.note.dotted ? "·" : ""));
    }

    componentDidMount(){
        var style = this.refs.note.getBoundingClientRect();

        this.box ={ left : style.left, right : style.right, bottom:style.bottom}
    }
}

class OctaveDot extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {className:"octaveDot"}, "·")
    }
}

class Score extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            underbarPoses : this.props.underbars.map(elem => ({left:0, width:0, top:0})),
            octavePoses : this.props.octaves.map(elem => {top:0}),
            measures : this.GetExtendedMeasures()
        }
    }

    handleResize() {
        this.setState((previousState) => ({
            underbarPoses : previousState.underbarPoses,
            measures : previousState.measures
        }));
    }

    GetNotePoses(){
        let notePosTable = {};

        for (let ithMeasure in this.refs){
            for (let ithBeat in this.refs[ithMeasure].refs){
                for(let ithNote in this.refs[ithMeasure].refs[ithBeat].refs){
                    let elem = this.refs[ithMeasure].refs[ithBeat].refs[ithNote];
                    if(elem.props.note.index){
                        notePosTable[elem.props.note.index] = {left:elem.box.left, right:elem.box.right, bottom:elem.box.bottom};
                    }
                }
            }
        }

        return notePosTable;

    }

    GetExtendedMeasures(){
        let extendedMeasures = []

        this.props.measures.forEach(function(note){
            if(note.duration > 1){
                extendedMeasures.push({pitch: note.pitch, duration: 1, index:null});
                for(let i = 1; i < note.duration; i++){
                    extendedMeasures.push({pitch: "–", duration : 1, index:null})
                }
            } else {
                extendedMeasures.push(note);
            }
        });

        return GroupByLength(extendedMeasures, 4)
    }

    MeasureElems(){

        return []
            .concat(this.state.measures.map((measure,index) =>
                [Elem(Measure, {ref:"measure-"+index, measure: measure, key:2*index}), Elem(Vertbar, {key:2*index+1})]
            ))
            .concat(Elem(Finalbar, {key:205}));

    }

    UnderbarElems(keyOffset){
        // the changing of state in componentDidMount will cause a rerendering.
        // that's why we need to store the underbar position in local state.

        return this.state.underbarPoses.map((elem, index) =>
            Elem(Underbar, {key:index+keyOffset, ref:"bar-"+index, left:elem.left, width:elem.width, top:elem.top})
        )
    }

    render() {

        let measureElems = this.MeasureElems();

        let totalElems = [].concat(measureElems).concat(this.UnderbarElems(measureElems.length))

        return Elem('div', {ref:"score", className:"score"}, totalElems);
    }

    GetUnderbarPoses(){
        let notePosTable = this.GetNotePoses();

        let scorePos = this.refs.score.getBoundingClientRect();
        // console.log(this.props.top)
        // by subtracting the score position from the underbar position,
        // we made the new undarbar position relative to score element.
        return this.props.underbars.map((elem) => ({
            left:notePosTable[elem.start].left - scorePos.left,
            width:notePosTable[elem.end].right - notePosTable[elem.start].left,
            top:notePosTable[elem.start].bottom + elem.level * 3 + this.props.top - scorePos.top - 15})
        )
    }

    GetOctavePoses(){

    }

    componentDidUpdate(prevProps, prevState){

        // setting underbar position
        if(prevProps.top != this.props.top){

            this.setState({
                measures : prevState.measures,
                underbarPoses : this.GetUnderbarPoses()
            })
        }
    }

}

class Container extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            scoreTop : 0,
            value : scoreText,
            sections : this.GetSections(scoreText)
        };
    }

    GetSections(text){
        let sectionFinder = /\s+(\w+)\s*:\s*\{([^:]*)\}/g;

        let model;
        let matched, newSections = [];
        while (matched = sectionFinder.exec(text)){
            newSections.push({name : matched[1], body : matched[2]})
        }
        return newSections
    }

    handleChange(event) {
        event.persist()

        let val = event.target.value;

        this.setState((previousState) => ({
            scoreTop : previousState.scoreTop,
            value : val,
            sections : this.GetSections(val)
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

                    // console.log(JSON.stringify(scoreModel.octaves))

                    elems.push(
                        SectionElem(this.state.sections[i].name, i, Elem(Score,
                            {
                                top:this.state.scoreTop,
                                measures:scoreModel.measures,
                                underbars:scoreModel.underbars,
                                octaves : scoreModel.octaves
                            }
                        ))
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
        }, Elem('div', {ref:"preview", id:'page', className:'page'}, this.sectionElems()))

        const row = Elem(Row, {},
            [editorWrapper, preview]
        );

        return row
    }

    componentDidMount(){
        let top = 0;
        top += this.refs.title.getBoundingClientRect().height;
        top += this.refs.subtitle.getBoundingClientRect().height;
        top += this.refs.composer.getBoundingClientRect().height;
        top += this.refs.beats.getBoundingClientRect().height;

        this.setState((previousState) => ({
            scoreTop : top,
            value : previousState.text,
            sections : previousState.sections
        }));

    }
}

Draw(Container, {}, "null", 'container');
