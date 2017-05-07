import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Vertbar, Finalbar, Repeatbar} from "./Bars.js";

import {Connect} from "./Connect.js";

import {Measure} from "./Measure.js";

import {MeasureBlock} from "./MeasureBlock.js";


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

        this.state = {
            noteBoxes : [],
            underbars : [],
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


    MeasureBarElem(type, index, slot){
        let elem;
        if(type == "normal"){
            elem = [Elem(Vertbar, {key:5300+index-1, slot:slot })]
        } else if (type == "rep_start"){
            elem = [Elem(Repeatbar, {key:5300+index-1, direction:"open", slot:slot })]
        } else if (type == "rep_fin"){
            elem = [Elem(Repeatbar, {key:5300+index-1, direction:"close", slot:slot })]
        } else if (type == "fin"){
            elem = [Elem(Finalbar, {key:6300, slot:slot })]
        }

        return elem;
    }

    UnderbarElems(){

        let scoreLeft = !!this.state.scoreBox ? this.state.scoreBox.left : 0,
            scoreTop = !!this.state.scoreBox  ? this.state.scoreBox.top : 0;

        console.log(scoreTop);

        return this.state.underbars.map((underbar, index) => {

            let barLeft = this.state.noteBoxes[underbar.start].left - scoreLeft + 10,
                barRight = this.state.noteBoxes[underbar.end].right - scoreLeft + 10,
                barTop = this.state.noteBoxes[underbar.start].bottom + (underbar.level-1) * 3 - 30;

                // console.log(underbar.start +" "+ barLeft + " " + underbar.end + " " + barRight);

            return Elem(Underbar, {key: 1280 + index, left: barLeft, width: barRight - barLeft, top:barTop})
        })
    }

    MeasureElems(){

        // console.log(this.props.chorus.measures);

        return []
            .concat(this.props.chorus.measures.map((measure,index) =>{
                if(!!measure.beats){
                    return [Elem(Measure, {ref:"measure-"+index, measure: measure, key:index, style:"measure"}), this.MeasureBarElem(measure.type, index, measure.beats[0])];
                } else {

                    let measureParts = measure.map((measurePart, index) => {
                        return Elem(Measure, {ref:"measure-"+index, measure: measurePart, key:index, style:"measure-inner"});
                    })

                    let measureBarParts = measure.map((measurePart, index) => {
                        return this.MeasureBarElem(measurePart.type, index, measurePart.beats[0])
                    });

                    return [Elem(MeasureBlock, {ref: "measure-block-"+index, measure:measure, key:index*2}),
                            Elem('div', {key:index*2+1, className:"bar-block"}, measureBarParts)];
                }
            }))
            .concat(this.UnderbarElems())
            // .concat(this.BracketElems())
            // .concat(this.ConnectElems())
    }

    render() {
        return Elem('div', {className:"score", ref:"score"}, this.MeasureElems());
    }


    Traverse(system){

        let listedSystem = Object.keys(system).map(key => system[key])

        return listedSystem.reduce((boxes, note) => {
            return boxes.concat( !!note.box ? {box:note.box, index:note.props.note.index} : this.Traverse(note.refs))
        }, [])
    }

    Permute(system){

        let traversed = this.Traverse(system);
        let permuted = [];

        for (var box of traversed){
            permuted[box.index] = box.box;
        }

        return permuted;
    }

    componentDidMount(){

        let scoreBox = this.refs.score.getBoundingClientRect();
        delete this.refs.score;

        let printable = this.props.chorus.measures.map(measure => {
            return measure.beats.map(beat => {
                return beat.map(slot => {
                    return slot.map(note => {
                        // console.log(beat)
                        if (note.pitch)
                            return note.pitch;
                        else if(note.verse)
                            return note.verse.join();
                        else
                            return " ";
                    }).join(" ");
                }).join(", ");
            });
        })

        // console.log(JSON.stringify(printable, null, 2));

        this.setState({
            scoreBox : scoreBox,
            noteBoxes : this.Permute(this.refs),
            underbars : this.props.chorus.underbars
        })

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
