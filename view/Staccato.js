import React from 'react';
import ReactDOM from 'react-dom';

import { Row, Col, Button } from 'react-bootstrap';

import {parse} from './StaccatoParser.pegjs';

import scoreText from '../What_A_Friend.txt';

import {default as Sidebar} from 'react-sidebar';


Array.prototype.riffle = function(func){
    let res = [];

    for(let i=0; i < this.length; i++){
        res.push(this[i]); res.push(func(this[i], i, this.length))
    }

    return res
}

Array.prototype.last = function(){
    return this[this.length - 1]
}

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

class Repeatbar extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {className:"repeatbar" + (this.props.initial ? " initialbar" : "")}, [
            Elem('span', {className:"dotUpper", key:42944})
        ])
    }
}

class Measure extends React.Component{
    constructor(props){
        super(props);
        this.notePoses = {}
    }

    GetNotePoses(){
        let notePoses = {}

        for(let ithBeat in this.refs){
            if(ithBeat != "measure"){
                let elem = this.refs[ithBeat]
                Object.assign(notePoses, elem.notePoses)
            }
        }

        return notePoses;
    }

    BeatElems(){
        // console.log(this.props.measure.repeat)
        return this.props.measure.map((beat, index)=>Elem(Beat, {
            ref:index,
            beat:beat.beatNote,
            underbar:beat.underbar,
            key:index
        }));
    }

    render() {
        let width = (this.props.measure[0].beatNote.length == 0) ? {minWidth: 0} : {}
        return Elem('div', {style:width, ref:"measure", className:"measure"}, this.BeatElems());
    }

    componentDidMount(){
        this.notePoses = this.GetNotePoses()
    }
}

class Beat extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            underbarPoses : this.props.underbar.map((elem) => ({left:0, width:0, top:0}))
        }
        this.notePoses = {}
    }

    GetNotePoses(){

        let notePoses = {};

        for(let ithNote in this.refs){
            if(ithNote != "beat"){
                let elem = this.refs[ithNote]

                if(elem.props.note.index){
                    notePoses[elem.props.note.index] = elem.box
                }

            }
        }

        return notePoses;

    }

    GetUnderbarPoses(notePoses, beatBox){

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
        let underbarredNotes = this.NoteElems().concat(underbarElems);

        if(this.props.repeatNotOnSide && this.props.beat.some(elem => (elem.repeat == "open"))){
            underbarredNotes = [Elem(Repeatbar, {key:offset, direction:"open"})].concat(underbarredNotes)
        }
        if(this.props.repeatNotOnSide && this.props.beat.some(elem => (elem.repeat == "close"))){
            underbarredNotes = underbarredNotes.concat(Elem(Repeatbar, {key:offset, direction:"close"}))
        }


        return Elem('span', {ref:"beat", className: "beat"}, underbarredNotes);
    }

    componentDidMount(){

        let beatBox = this.refs.beat.getBoundingClientRect();

        this.notePoses = this.GetNotePoses();

        this.setState({underbarPoses:this.GetUnderbarPoses(this.GetNotePoses(), beatBox)})
    }

}

class Pitch extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {ref:"pitch", className:"pitch"}, this.props.pitch);
    }
}

class Note extends React.Component{
    constructor(props){
        super(props);
        this.box = { left : 0, right : 0 }

        this.state = {
            octaveDotPoses : []
        }
    }

    GetOctaveDotPoses(){
        let octaveDotPoses = []
        if(this.props.note.octave){

            let octave = this.props.note.octave;
            for (var i = 0; i < octave.num; i++) {
                octaveDotPoses.push({
                    index : this.props.note.pitch,
                    left : (this.box.right - this.box.left) / 2,
                    top : octave.side == "positive"
                          ? (-5 * i - this.box.height/2)
                          : (3 * this.props.note.conn.length + 5 * i + this.box.height/2)
                })
            }
        }
        return octaveDotPoses;
    }

    PitchElem(){
        return Elem(Pitch, {key:0, ref:"note", className:"note", pitch:this.props.note.pitch})
    }

    OctaveDotElem(){
        return this.state.octaveDotPoses.map((elem, index) =>
            Elem(OctaveDot, {key:1+index, ref:"dot-"+index, pos:elem})
        )
    }

    AccidentalElem(){
        return this.props.note.accidental
        ? [Elem(Accidental, {key:205, ref:"acc", acc:this.props.note.accidental})]
        : []
    }

    DotElem(){
        return this.props.note.dotted
        ? [Elem(Dot, {key:204, ref:"dot"})]
        : []
    }

    render(){

        let style = {
            marginLeft : -this.props.note.conn.length *0.7,
            marginRight : -this.props.note.conn.length *0.7
        }

        return Elem('span', {style:style, className:"note"}, [this.PitchElem()].concat(this.DotElem()).concat(this.AccidentalElem()).concat(this.OctaveDotElem()))
    }

    componentDidMount(){
        this.box = this.refs.note.refs.pitch.getBoundingClientRect();

        this.setState({octaveDotPoses: this.GetOctaveDotPoses()})
    }
}

class Accidental extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        // console.log(this.props.acc)
        let accidental = this.props.acc == "#" ? "\ue10f" : "\ue11b"

        return Elem('span', {className : "accidental"}, accidental)
    }
}

class Dot extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {className:"dot"}, "·")
    }
}


class OctaveDot extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {style:this.props.pos, className:"octavedot"}, "·")
    }
}

class Connect extends React.Component {
    constructor(props){
        super(props);
    }

    GetSVGCurveText(AX, AY, CAX, CAY, CBX, CBY, BX, BY, thickness){
        return "M" + AX  + " " + AY +
          "C" + CAX + " " + CAY + "," + CBX  + " " + CBY + "," + BX + " " + BY +
          "C" + CBX + " " + (CBY + thickness) + "," + CAX + " " + (CAY + thickness) + "," + AX + " " + AY +
          "Z"
    }

    render(){

        let startX  = this.props.startLeft,
            startY  = this.props.startTop,
            startCX  = this.props.startCLeft,
            startCY  = this.props.startCTop,

            endX    = this.props.endLeft,
            endY    = this.props.endTop,
            endCX    = this.props.endCLeft,
            endCY    = this.props.endCTop,

            fakeStartX = endX - 200,
            fakeEndX = startX + 200,
            fakeStartY = endY,
            fakeEndY = startY,

            fakeStartCX = endCX - 180,
            fakeEndCX = startCX + 180,
            fakeStartCY = endCY,
            fakeEndCY = startCY;

        let elem;
        if (startY == endY) {
            elem = Elem('svg', {
                xmlns:"http://www.w3.org/2000/svg"},
                Elem('path', {
                    d: this.GetSVGCurveText(startX, startY, startCX, startCY, endCX, endCY, endX, endY, 2),
                    fill : "black"
                }
            ))
        } else {
            elem = Elem('svg', {
                xmlns:"http://www.w3.org/2000/svg"},
                Elem('path', {
                    d:  this.GetSVGCurveText(startX, startY, startCX, startCY, fakeEndCX, fakeEndCY, fakeEndX, fakeEndY, 2) +
                        this.GetSVGCurveText(fakeStartX, fakeStartY, fakeStartCX, fakeStartCY, endCX, endCY, endX, endY, 2),
                    fill : "black"
                }
            ))
        }

        return elem
    }
}

class Score extends React.Component{
    constructor(props){
        super(props);

        this.notePoses = {},

        this.state = {
            connectPoses : this.props.connects.map(elem => ({startLeft:0, startCLeft:0, startTop:0, startCTop:0, endCLeft:0, endCTop:0, endLeft:0, endTop:0}))
        }
    }

    GetNotePoses(){
        let notePoses = {}

        for(let ithMeasure in this.refs){
            if(ithMeasure != "score"){
                let elem = this.refs[ithMeasure]
                Object.assign(notePoses, elem.notePoses)
            }
        }

        return notePoses;
    }

    GetConnectPoses(scoreBox){
        return this.props.connects.map(elem => ({
            startLeft:this.notePoses[elem.start].left - scoreBox.left,
            startTop : this.notePoses[elem.start].top - scoreBox.top,
            startCLeft: this.notePoses[elem.start].left - scoreBox.left + 5,
            startCTop : this.notePoses[elem.start].top - scoreBox.top - 15,
            endCLeft : this.notePoses[elem.end].left - scoreBox.left - 5,
            endCTop : this.notePoses[elem.end].top - scoreBox.top - 15,
            endLeft : this.notePoses[elem.end].left - scoreBox.left,
            endTop : this.notePoses[elem.end].top - scoreBox.top
        }))
    }

    ConnectElems(){
        return this.state.connectPoses.map((elem, index) => Elem(Connect, Object.assign(elem, {key:206+index})))
    }

    MeasureElems(){

        return []
            .concat(this.props.measures.map((measure,index) =>{
                let elem;
                if(measure[0].beatNote[0].repeat == "open") {
                    elem = [
                        Elem(Repeatbar, {key:5300+index, direction:"open", initial:true}),
                        Elem(Measure, {ref:"measure-"+index, measure: measure, key:index})
                    ]
                    index == 0 && elem.push(Elem(Vertbar, {key:5300+index-1}))

                } else if (measure.last().beatNote.last().repeat == "close") {

                    elem = [
                        Elem(Measure, {ref:"measure-"+index, measure: measure, key:index}),
                        Elem(Repeatbar, {key:5300+index, direction:"closed"})
                    ]

                } else {

                    elem = [
                        Elem(Measure, {ref:"measure-"+index, measure: measure, key:index}),
                        Elem(Vertbar, {key:5300+index})
                    ]

                }
                return elem;
            }))
            .concat(Elem(Finalbar, {key:6300}))
            .concat(this.ConnectElems())
    }

    render() {

        return Elem('div', {ref:"score", className:"score"}, this.MeasureElems());
    }

    componentDidMount(){

        let scoreBox = this.refs.score.getBoundingClientRect()

        this.notePoses = this.GetNotePoses()

        this.setState({
            connectPoses:this.GetConnectPoses(scoreBox)
        })

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
        let sectionFinder = /\s+(\w+)\s*\{([^\}]*)\}/g;

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

                    elems.push(
                        SectionElem(this.state.sections[i].name, i, Elem(Score,
                            {
                                measures:scoreModel.measures,
                                connects : scoreModel.connects
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
            rows      : 60,
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
