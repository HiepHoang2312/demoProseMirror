import { useEffect } from "react";

import { EditorState, Plugin } from "prosemirror-state";
import { EditorView, Decoration, DecorationSet } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";

const Prosemirror_test = () => {
  useEffect(() => {
    let placeholderPlugin = new Plugin({
      state: {
        init() {
          return DecorationSet.empty;
        },

        apply(tr, set) {
          set = set.map(tr.mapping, tr.doc);

          let action = tr.getMeta(this);
          if (action && action.add) {
            let widget = document.createElement("placeholder");
            let deco = Decoration.widget(action.add.pos, widget, {
              id: action.add.id,
            });
            set = set.add(tr.doc, [deco]);
          } else if (action && action.remove) {
            set = set.remove(
              set.find(null, null, (spec) => spec.id === action.remove.id),
            );
          }
          return set;
        },
      },
      props: {
        decorations(state) {
          return this.getState(state);
        },
      },
    });

    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block+"),
      marks: schema.spec.marks,
    });

    let view = (window.view = new EditorView(
      document.querySelector("#editor"),
      {
        state: EditorState.create({
          doc: DOMParser.fromSchema(schema).parse(
            document.querySelector("#content"),
            {
              preserveWhitespace: true,
            },
          ),
          plugins: exampleSetup({ schema: mySchema }).concat(placeholderPlugin),
        }),
      },
    ));

    function findPlaceholder(state, id) {
      let decos = placeholderPlugin.getState(state);
      let found = decos.find(null, null, (spec) => spec.id === id);
      return found.length ? found[0].from : null;
    }

    document.querySelector("#image-upload").addEventListener("change", (e) => {
      if (
        view.state.selection.$from.parent.inlineContent &&
        e.target.files.length
      )
        startImageUpload(view, e.target.files[0]);
      view.focus();
    });

    document.querySelector("#submit").addEventListener("click", (e) => {
      console.log(view.state.doc.content.toString(), "a");
      document.querySelectorAll("p:empty");
    });

    function startImageUpload(view, file) {
      // A fresh object to act as the ID for this upload
      let id = {};

      // Replace the selection with a placeholder
      let tr = view.state.tr;
      if (!tr.selection.empty) tr.deleteSelection();
      tr.setMeta(placeholderPlugin, { add: { id, pos: tr.selection.from } });
      view.dispatch(tr);

      uploadFile(file).then(

        (url) => {
          console.log(url, "3333");
          let pos = findPlaceholder(view.state, id);

          if (pos == null) return;

          view.dispatch(
            view.state.tr
              .replaceWith(pos, pos, schema.nodes.image.create({ src: url }))
              .setMeta(placeholderPlugin, { remove: { id } }),
          );
        },
        () => {
          view.dispatch(tr.setMeta(placeholderPlugin, { remove: { id } }));
        },
      );
    }

    function uploadFile(file) {
      let reader = new FileReader();
      return new Promise((accept, fail) => {
        reader.onload = () => accept(reader.result); 
        reader.onerror = () => fail(reader.error);

        setTimeout(() => reader.readAsDataURL(file), 1500);
      });
    }
  }, []);

  return (
    <div>
      <div id="editor"></div>

      <div id="content"></div>
      <div>
        Thêm ảnh: <input type="file" id="image-upload" />
      </div>
      <button id="submit">click</button>
    </div>
  );
};

export default Prosemirror_test;
