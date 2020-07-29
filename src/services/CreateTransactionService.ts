import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const findCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    let transactionCategory = null;

    if (!findCategory) {
      transactionCategory = categoriesRepository.create({ title: category });

      await categoriesRepository.insert({
        title: category,
      });
    } else {
      transactionCategory = findCategory;
    }

    const formattedType = type.toLowerCase();

    if (formattedType !== 'income' && formattedType !== 'outcome') {
      throw new AppError(
        'Invalid transaction type! Transactions can only have "income" or "outcome" types.',
      );
    }

    const { total } = await transactionsRepository.getBalance();

    if (formattedType === 'outcome' && value > total) {
      throw new AppError('Insufficient funds to complete this transaction!');
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type: formattedType,
      category: transactionCategory,
    });

    await transactionsRepository.save(transaction);

    delete transaction.category_id;

    return transaction;
  }
}

export default CreateTransactionService;
