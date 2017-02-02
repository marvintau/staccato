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
    }

    BeatElems(){
        return this.props.measure.map((beat, index)=>Elem(Beat, {
            ref:index,
            beat:beat.beatNote,
            underbar:beat.underbar,
            key:index
        }));
    }

    render() {
        return Elem('div', {ref:"measure", className:"measure"}, this.BeatElems());
    }
}

class Beat extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            underbarPoses : this.props.underbar.map((elem) => ({left:0, width:0, top:0}))
        }
    }

    GetNotePoses(){

        let notePoses = {};

        for(let ithNote in this.refs){
            if(ithNote != "beat"){
                let elem = this.refs[ithNote]

                if(elem.props.note.index){
                    notePoses[elem.props.note.index] = {
                        left:elem.box.left,
                        right:elem.box.right,
                        bottom:elem.box.bottom
                    };
                }

            }
        }

        return notePoses;

    }

    GetUnderbarPoses(notePoses){

        let beatBox = this.refs.beat.getBoundingClientRect();

        // by subtracting the score position from the underbar position,
        // we made the new undarbar position relative to score element.
        return this.props.underbar.map((elem) => ({
            left:notePoses[elem.start].left - beatBox.left,
            width:notePoses[elem.end].right - notePoses[elem.start].left,
            top:notePoses[elem.start].bottom + elem.level * 3 - beatBox.top})
        )
    }


    NoteElems(){
        return this.props.beat.map((note, index)=>Elem(Note, {ref:index, key:index, note:note}));
    }

    UnderbarElems(offset){
        return this.state.underbarPoses.map((elem, index) => Elem(Underbar, {key:index+offset, left:elem.left, width:elem.width, top:elem.top}))
    }

    render() {
        let underbarElems = this.UnderbarElems(this.NoteElems().length);
        return Elem('span', {ref:"beat", className: "beat"}, this.NoteElems().concat(underbarElems));
    }

    componentDidMount(){
        this.setState({underbarPoses:this.GetUnderbarPoses(this.GetNotePoses())})
    }

}

class Note extends React.Component{
    constructor(props){
        super(props);
        this.box = { left : 0, right : 0 }
    }

    render(){
        return Elem('span', {ref:"note", className:"note"}, this.props.note.pitch + (this.props.note.dotted ? "·" : ""));
    }

    componentDidMount(){
        this.box = this.refs.note.getBoundingClientRect();
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
            underbarPoses : this.props.underbars.map(elem => ({left:0, width:0, top:0}))
        }
    }

    handleResize() {
        this.setState((previousState) => ({
            underbarPoses : previousState.underbarPoses,
            measures : previousState.measures
        }));
    }

    MeasureElems(){

        return []
            .concat(this.props.measures.map((measure,index) => [
                Elem(Measure, {ref:"measure-"+index, measure: measure, key:2*index}),
                Elem(Vertbar, {key:2*index+1})
            ]))
            .concat(Elem(Finalbar, {key:205}));
    }

    render() {
        return Elem('div', {ref:"score", className:"score"}, this.MeasureElems());
    }
}

class Container extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
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

                    // console.log(JSON.stringify(scoreModel.measures))

                    elems.push(
                        SectionElem(this.state.sections[i].name, i, Elem(Score,
                            {
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

        this.setState((previousState) => ({
            value : previousState.text,
            sections : previousState.sections
        }));

    }
}

Draw(Container, {}, "null", 'container');
