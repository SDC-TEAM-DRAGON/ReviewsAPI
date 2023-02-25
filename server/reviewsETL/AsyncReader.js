// Wrapper of readline async iterator
// Provide peek functionality and auto parse CSV rows
class AsyncReader {
  constructor(iterator) {
    this.iterator = iterator;
    // State is perversed for peek functionality
    this.state = null;
  }

  // Convert naive next object into array of CSV tuples
  parse(rawNext) {
    // When no more next return null
    if (rawNext.done) return null;

    // String and Null value should be parsed different for easier Mongoose Cast
    return rawNext.value.split(',').map(tuple => {
      if (tuple === 'null') return null;
      if (tuple.startsWith('"')) return tuple.slice(1, -1);
      return tuple;
    });
  }

  // Wrapper of next function
  async next() {
    if (this.state) {
      const result = this.state;
      this.state = null;
      return result;
    }

    const rawNext = await this.iterator.next();
    return this.parse(rawNext);
  }

  // Peek will not consume the next, instead perserved in [this.state]
  async peek() {
    if (this.state) return this.state;

    const rawNext = await this.iterator.next();
    const parsedNext = this.parse(rawNext);

    this.state = parsedNext;
    return this.state;
  }
}

module.exports = { AsyncReader };