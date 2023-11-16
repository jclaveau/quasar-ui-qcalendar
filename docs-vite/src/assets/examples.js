/*
 * Export files list for /examples folder
 */

function kebabCase (str) {
  const result = str.replace(
    /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g,
    match => '-' + match.toLowerCase()
  )
  return (str[ 0 ] === str[ 0 ].toUpperCase())
    ? result.substring(1)
    : result
}

function slugify (str) {
  return encodeURIComponent(String(str).trim().replace(/\s+/g, '-'))
}

export default Object.entries(import.meta.glob("../examples/*.vue"))
  .map(([componentPath, component]) => {
    const name = componentPath.replace(/^\.\.\/examples\//, '').replace('.vue', '')
    return {
      path: slugify(kebabCase(name)),
      name,
      title: name + '.vue',
      component
    }
  })
  .filter(example => example.name !== 'Index' && example.name !== 'Error404') // TODO aren't they already removed?
