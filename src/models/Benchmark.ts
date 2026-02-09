/**
 * Benchmark model stub
 * Replace with actual database model
 */

interface BenchmarkDoc {
  _id?: string;
  provider: string;
  network: string;
  timestamp: Date;
  metrics: any;
  scores: any;
}

class BenchmarkStub {
  async create(data: BenchmarkDoc) {
    console.log('[Benchmark] Create called with:', data.provider);
    return data;
  }

  async find(query: any) {
    console.log('[Benchmark] Find called with:', query);
    return [];
  }

  async findOne(query: any) {
    console.log('[Benchmark] FindOne called with:', query);
    return null;
  }

  async updateOne(query: any, update: any) {
    console.log('[Benchmark] UpdateOne called');
    return { modifiedCount: 0 };
  }

  async deleteMany(query: any) {
    console.log('[Benchmark] DeleteMany called');
    return { deletedCount: 0 };
  }

  async findOneAndUpdate(query: any, update: any, options?: any) {
    console.log('[Benchmark] FindOneAndUpdate called');
    return null;
  }
}

const Benchmark = new BenchmarkStub();

export default Benchmark;
