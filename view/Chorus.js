import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Vertbar, Finalbar, Repeatbar} from "./Bars.js";

import {Connect} from "./Connect.js";

import {Measure} from "./Measure.js";

class Bracket extends React.Component{
    constructor(props){
        super(props);
    }
    render(){
        let x = this.props.pos.bottom - this.props.pos.top,
            y = Math.ceil(57983 + (x - 168) * 1.95);
        return Elem('span', {style:this.props.pos, className:"bracket"}, String.fromCharCode(y));
    }
}


class Chorus extends React.Component{
    constructor(props){
        super(props);

        this.notePoses = {},

        this.state = {
            brackets : [],
            connects : []
        }
    }

    GetConnectPoses(scoreBox, startBox, endBox){

        return {
            startLeft   : startBox.left - scoreBox.left,
            startTop    : startBox.top - scoreBox.top,
            startCLeft  : startBox.left - scoreBox.left + 2,
            startCTop   : startBox.top - scoreBox.top - 10,
            endCLeft    : endBox.left - scoreBox.left - 2,
            endCTop     : endBox.top - scoreBox.top - 10,
            endLeft     : endBox.left - scoreBox.left,
            endTop      : endBox.top - scoreBox.top
        }
    }

    ConnectElems(){
        return this.state.connects.map((elem, index) => Elem(Connect, Object.assign(elem, {key:206+index})))
    }

    BracketElems(){
        return this.state.brackets.map((bracket, index) =>{
            return Elem(Bracket, {pos:{top:bracket.top, left:bracket.left, bottom:bracket.bottom}, key:502+index})
        });
    }

    MeasureElems(){

        return []
            .concat(this.props.measures.map((measure,index) =>{
                let elem = [Elem(Measure, {ref:"measure-"+index, measure: measure, key:index})];

                if(measure.measureType == "normal"){
                    elem.push(Elem(Vertbar, {key:5300+index-1, parts:this.props.parts, lyricLines : lyricLines}))
                } else if (measure.measureType == "rep_start"){
                    elem.push(Elem(Repeatbar, {key:5300+index-1, direction:"open", parts:this.props.parts, lyricLines : lyricLines}))
                } else if (measure.measureType == "rep_fin"){
                    elem.push(Elem(Repeatbar, {key:5300+index-1, direction:"close", parts:this.props.parts, lyricLines : lyricLines}))
                } else if (measure.measureType == "fin"){
                    elem.push(Elem(Vertbar, {key:5300+index-1, parts:this.props.parts, lyricLines : lyricLines}))
                    elem.push(Elem(Finalbar, {key:6300, parts:this.props.parts, lyricLines : lyricLines}))
                }

                return elem;
            }))
            // .concat(this.BracketElems())
            // .concat(this.ConnectElems())
    }

    render() {
        return Elem('div', {ref:"score", className:"score"}, this.MeasureElems());
    }

    componentDidMount(){

        let scoreBox = this.refs.score.getBoundingClientRect()

        // let conns = this.props.connections, connPoses = [];
        // Object.keys(conns).forEach(part =>{
        //     conns[part].ranges.forEach(range => {
        //
        //         let start    = range.start,
        //             end      = range.end,
        //             startBox = this.refs["measure-"+start.measure].refs["slot-"+start.beat].refs[part].refs[start.note].box,
        //             endBox   = this.refs["measure-"+end.measure].refs["slot-"+end.beat].refs[part].refs[end.note].box;
        //
        //             console.log(startBox);
        //
        //         connPoses.push(this.GetConnectPoses(scoreBox, startBox, endBox));
        //     });
        // });
        //
        // let bracketsBoxes = this.props.measures.map((_, i) => {
        //
        //     let offset = (Math.floor(this.refs["measure-"+i].box.bottom) - Math.floor(this.refs["measure-"+i].box.top))/2 - 40;
        //     return {
        //         left:Math.floor(this.refs["measure-"+i].box.left - scoreBox.left),
        //         top:Math.floor(this.refs["measure-"+i].box.top + offset),
        //         bottom:Math.floor(this.refs["measure-"+i].box.bottom)
        //     }
        // }).groupBy("left"),
        //     bracketsBoxesLeftmost = bracketsBoxes[Object.keys(bracketsBoxes)[0]];
        //
        // this.setState({
        //     brackets : bracketsBoxesLeftmost,
        //     connects : connPoses
        // })

    }
}

export {Chorus};
