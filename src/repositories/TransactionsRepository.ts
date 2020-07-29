import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const incomeTransactions = transactions.filter(
      transaction => transaction.type === 'income',
    );

    const outcomeTransactions = transactions.filter(
      transaction => transaction.type === 'outcome',
    );

    const income = incomeTransactions.reduce(
      (sum, current) => sum + Number(current.value),
      0,
    );

    const outcome = outcomeTransactions.reduce(
      (sum, current) => sum + Number(current.value),
      0,
    );

    return {
      income,
      outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;
