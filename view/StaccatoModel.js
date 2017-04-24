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

Array.prototype.groupBy = function(key) {
    return this.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

function Flatten(scoreObject, durFactor, conn){
    return scoreObject.reduce((list, elem) => {

        let dur = elem.duration/durFactor;

        return list.concat( elem.notes ?
        Flatten(elem.notes, elem.factor * durFactor, elem.conn.concat(conn)) :
        (elem.conn ?
            Object.assign(elem, {duration:dur, "conn" : elem.conn.concat(conn)}) :
            Object.assign(elem, {duration:dur, "conn" : conn}))
        )}, [])
}

function GroupBeat(notes) {
    let duration = 0;

    let beats = [{notes:[]}];
    notes.forEach(note =>{
        duration += note.duration;
        (duration <= 1) && beats[beats.length - 1].notes.push(note);

        if(duration == 1){
            duration = 0;
            beats.push({notes : []});
        }
    })

    beats.forEach(beat =>{
        beat.underbar = GetDurations(beat.notes);
    })
    return beats;
}

function GetDurations(notes){

    let curr =[];
    let res  =[];

    notes.forEach(function(note, noteIndex){

        for (var i = 0; i < Math.max(note.conn.length, curr.length); i++) {

            // current underbar exists, and have same type with underbar of current note
            // then enlong the current underbar
            if(curr[i] && curr[i].type == note.conn[i]){
                curr[i].end = noteIndex;

            } else {

                // if current underbar exists, but underbar of current note doesn't exist,
                // or has different type to current underbar, the current bar is done.
                curr[i] && res.push(curr[i]);

                // if the ith underbar of current note exists, but the ith current underbar
                // could be either not created or finished, assign it with a new object.
                // if not, then rewrite as undefined.
                curr[i] = note.conn[i] ? {start:noteIndex, end:noteIndex, level:i, type:note.conn[i]} : undefined;
            }
        }

        delete note.conn
    })

    for (var i = 0; i < curr.length; i++) {
        curr[i] && res.push(curr[i]);
    }

    return res;
}


function GetConnectionRanges(measures){
    let res = [];

    let slot = 0;
    let isConnecting = false;
    let slots = [];

    measures.forEach(function(measure, index){
        measure.beats.forEach(function(beat, beatIndex){
            beat.notes.forEach(function(note, noteIndex){


                if((note.pitch != "–") && (note.pitch != "0") && !isConnecting){                        
                    slots.push({measure:index, beat:beatIndex, note:noteIndex})
                }


                if((res.length==0 || (res.length>0 && res[res.length - 1].end)) && note.upperConn == "open") {
                    res.push({start:{measure:index, beat:beatIndex, note:noteIndex}});
                    isConnecting = true;
                }

                if(res.length>0 && !res[res.length-1].end && note.upperConn == "close"){
                    res[res.length-1].end = {measure:index, beat:beatIndex, note:noteIndex}

                    isConnecting = false;
                }

                delete note.upperConn
            })
        })
    })
    return {ranges:res, slots:slots};
}

function zipMeasure(chorus, parts) {

    chorus.measures = chorus[parts[0]]["measures"].map((_) => ({}))
    chorus.connections = {}


    chorus[parts[0]].measures.forEach( (_, index) => {
        parts.forEach(part => {
            chorus.measures[index][part] = chorus[part].measures[index];
            chorus.measures[index].measureType = chorus[part].measures[index].measureType.measureType;
        })

        chorus.measures[index] = zipBeat(chorus.measures[index], parts)
    })

    parts.forEach(part => {
        chorus.connections[part] = chorus[part].connections
    })

    for (var part of parts) {
        delete chorus[part];
    }

    return chorus;
}

function zipBeat(measure, parts) {
    measure.beats = measure[parts[0]]["beats"].map((_) => ({}))

    measure[parts[0]].beats.forEach( (_, index) => {
        parts.forEach(part => {

            measure[part].beats[index].notes.forEach(note =>{
                delete note.conn
            })

            measure.beats[index][part] = measure[part].beats[index]
        })
    })

    for (var part of parts) {
        delete measure[part];
    }

    return measure;
}

function zipLyric(lyrics) {
    return lyrics[0].map((verse,i) => lyrics.map(verse => verse[i]))
}

function groupBy(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

function processMeasure(measure){
    let flattenedNotes = Flatten(notes, 1, []).map((note, index) =>
        Object.assign(note, {
            octave: note.octave ? {start:(note.octave>0 ? 0 : note.conn.length), nums:note.octave} : undefined
        })
    );
    let durationExtendedBeats = [];

    flattenedNotes.forEach(note => {
        durationExtendedBeats.push(note);
        for (let i = 0; i < note.duration - 1; i++) {
            durationExtendedBeats.push({
                pitch : "-",
                duration : 1
            })
        }

        if(note.duration > 1){
            note.duration = 1
        }
    })

    let beats = GroupBeat(durationExtendedBeats);

}

function organizeLyricAndMusic(sections){

    let score = {}, chorus={}, parts = [], verses= {};

    let isPolyphony = null;

    sections.forEach(elem => {
        if(elem.name == "parts"){

            parts = elem.parts;
        
        } else if(elem.name == "phony"){
        
            isPolyphony = elem.content;
        
        } else if(elem.name == "verse"){
        
            if(isPolyphony == "homophony"){
                verse[elem.part] = elem.content;
            } else if(isPolyphony == "isPolyphony") {
                verse.homophony = elem.content;
            } else {
                verse = {errorMsg : "不好意思……你需要在verse section之前就说清楚主调／复调类型"}
            }
        
        } else if(elem.name == "chorus"){
        
            // if(elem.part)

            chorus[elem.part] = elem.content;
        
        } else {
        
            score[elem.name] = elem.content
        
        }
    })

}


function processSections(sections){


    let groupedLyric = groupBy(verses, 'part')
    for(var part in groupedLyric){
        groupedLyric[part] = zipLyric(groupedLyric[part].map(lyric => lyric.verse))
    }

    let zippedChorus = zipMeasure(chorus, parts)

    chorus.connections[parts[0]].slots.forEach((slot, index) =>{
        if(!zippedChorus.measures[slot.measure].beats[slot.beat].lyric){
                zippedChorus.measures[slot.measure].beats[slot.beat].lyric = {};
        }
        if(groupedLyric.unison){
            zippedChorus.measures[slot.measure].beats[slot.beat].lyric[slot.note] = groupedLyric.unison[index]
        } else {
            for(part of parts){
                zippedChorus.measures[slot.measure].beats[slot.beat].lyric[slot.note] = groupedLyric[part] ? groupedLyric[part][index] : {}
            }
        }
    })

    zippedChorus.parts = parts;
    score.chorus = zippedChorus;
    score.lyricLines = verses.length;
    return score;
}

export {processSections};