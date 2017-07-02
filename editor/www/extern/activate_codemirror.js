$(function(){
    $('.cypher_textarea').each(function(index, elem){
          CodeMirror.fromTextArea(elem, {
                mode:'cypher',
                lineNumbers: true,
                theme: 'neo'
          });
    });

    $('.javascript_textarea').each(function(index, elem){
          var cm = CodeMirror.fromTextArea(elem, {
                mode:'javascript',
                lineNumbers: true,
                theme: 'neo'
          });
          cm.setSize(200, 200);
          $(cm.getWrapperElement()).css('width', 'auto');
    });

    $('.javascript_textarea_big').each(function(index, elem){
          var cm = CodeMirror.fromTextArea(elem, {
                mode:'javascript',
                lineNumbers: true,
                theme: 'neo'
          });
          cm.setSize(200, 400);
          $(cm.getWrapperElement()).css('width', 'auto');
    });
});