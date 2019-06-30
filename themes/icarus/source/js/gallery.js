document.addEventListener('DOMContentLoaded', function () {
    if (typeof ($.fn.lightGallery) === 'function') {
        $('.article').lightGallery({ selector: '.gallery-item' });
    }
    //修稿默认的间隙和缩率图的大小
    if (typeof ($.fn.justifiedGallery) === 'function') {
        $('.justified-gallery').justifiedGallery({
          rowHeight:160,
          margins:4,
          lastRow : 'justify',
          maxRowHeight:300});
    }
});
