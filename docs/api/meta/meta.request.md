### Meta Request

``query`` - MongoDB-like query object, where all objects must be matched against; should support ``$in``, ``$exists``, ``$gt``, ``$lt`` operators; on ``meta.search`` method, this is a string

``sort`` - an single-property object of the format ``{ property: -1 }``; the value can be ``-1`` for descending sort and ``1`` for ascending, and the property should be a property you already return in your [Meta Element](meta.element.md); **NOTE:** this only applies for ``meta.find``

``projection`` - MongoDB-like projection object, also accepts string values - ``lean``, ``medium`` and ``full``; lean contains name, year, release date, cast, director; medium also includes episodes (if applicable) and the full projection also includes all images and full cast info

``complete`` - only return items with complete (+images) metadata

``limit`` - limit to N results

``skip`` - skip first N results

_**TIP**: If you don't use MongoDB, you can use [sift](https://www.npmjs.com/package/sift) or [linvodb3](https://www.npmjs.com/package/linvodb3) to support to the query format._
